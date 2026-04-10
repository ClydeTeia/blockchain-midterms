import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import {
  ReentrantWithdrawReceiver__factory,
  RejectEtherReceiver__factory,
  TipPost__factory,
} from "../typechain-types";

describe("TipPost", function () {
  async function deployTipPostFixture() {
    const [owner, creator, liker, other] = await ethers.getSigners();
    const tipPostFactory = await ethers.getContractFactory("TipPost");
    const deployedTipPost = await tipPostFactory.deploy();
    await deployedTipPost.waitForDeployment();
    const tipPost = TipPost__factory.connect(await deployedTipPost.getAddress(), owner);

    return { tipPost, owner, creator, liker, other };
  }

  it("creates a post and emits PostCreated", async function () {
    const { tipPost, creator } = await deployTipPostFixture();

    await expect(
      tipPost.connect(creator).createPost("https://picsum.photos/600/400", "My first post")
    )
      .to.emit(tipPost, "PostCreated")
      .withArgs(1n, creator.address, "https://picsum.photos/600/400", "My first post", anyValue);

    const savedPost = await tipPost.posts(1n);
    expect(savedPost.id).to.equal(1n);
    expect(savedPost.creator).to.equal(creator.address);
    expect(savedPost.likes).to.equal(0n);
    expect(savedPost.totalEarned).to.equal(0n);
    expect(savedPost.metadataURI).to.equal("");
    expect(await tipPost.postCount()).to.equal(1n);
  });

  it("creates a metadata-based post and emits PostCreatedWithMetadata", async function () {
    const { tipPost, creator } = await deployTipPostFixture();

    await expect(
      tipPost
        .connect(creator)
        .createPostWithMetadata("ipfs://bafybeihash/metadata.json")
    )
      .to.emit(tipPost, "PostCreatedWithMetadata")
      .withArgs(1n, creator.address, "ipfs://bafybeihash/metadata.json", anyValue);

    const savedPost = await tipPost.posts(1n);
    expect(savedPost.imageUrl).to.equal("");
    expect(savedPost.caption).to.equal("");
    expect(savedPost.metadataURI).to.equal("ipfs://bafybeihash/metadata.json");
  });

  it("likes successfully, transfers exact tip, and emits PostLiked", async function () {
    const { tipPost, creator, liker } = await deployTipPostFixture();

    await tipPost.connect(creator).createPost("https://picsum.photos/600/400", "Support my post");
    const likeCost = await tipPost.likeCost();

    const creatorBalanceBefore = await ethers.provider.getBalance(creator.address);

    await expect(tipPost.connect(liker).likePost(1n, { value: likeCost }))
      .to.emit(tipPost, "PostLiked")
      .withArgs(1n, liker.address, likeCost, 1n, likeCost);

    const creatorBalanceAfter = await ethers.provider.getBalance(creator.address);
    expect(creatorBalanceAfter - creatorBalanceBefore).to.equal(likeCost);

    const savedPost = await tipPost.posts(1n);
    expect(savedPost.likes).to.equal(1n);
    expect(savedPost.totalEarned).to.equal(likeCost);
    expect(await tipPost.totalEarnedByUser(creator.address)).to.equal(likeCost);
    expect(await tipPost.checkLiked(1n, liker.address)).to.equal(true);
  });

  it("rejects double likes", async function () {
    const { tipPost, creator, liker } = await deployTipPostFixture();

    await tipPost.connect(creator).createPost("https://picsum.photos/600/400", "Only one like per wallet");
    const likeCost = await tipPost.likeCost();

    await tipPost.connect(liker).likePost(1n, { value: likeCost });

    await expect(tipPost.connect(liker).likePost(1n, { value: likeCost }))
      .to.be.revertedWithCustomError(tipPost, "AlreadyLiked");
  });

  it("rejects self-like", async function () {
    const { tipPost, creator } = await deployTipPostFixture();

    await tipPost.connect(creator).createPost("https://picsum.photos/600/400", "Cannot like my own post");
    const likeCost = await tipPost.likeCost();

    await expect(tipPost.connect(creator).likePost(1n, { value: likeCost }))
      .to.be.revertedWithCustomError(tipPost, "CannotLikeOwnPost");
  });

  it("rejects likes for missing posts", async function () {
    const { tipPost, liker } = await deployTipPostFixture();

    const likeCost = await tipPost.likeCost();

    await expect(tipPost.connect(liker).likePost(1n, { value: likeCost }))
      .to.be.revertedWithCustomError(tipPost, "PostNotFound");
  });

  it("rejects underpay and overpay", async function () {
    const { tipPost, creator, liker } = await deployTipPostFixture();

    await tipPost.connect(creator).createPost("https://picsum.photos/600/400", "Exact tip only");
    const likeCost = await tipPost.likeCost();

    await expect(tipPost.connect(liker).likePost(1n, { value: likeCost - 1n }))
      .to.be.revertedWithCustomError(tipPost, "IncorrectTipAmount");

    await expect(tipPost.connect(liker).likePost(1n, { value: likeCost + 1n }))
      .to.be.revertedWithCustomError(tipPost, "IncorrectTipAmount");
  });

  it("returns paginated posts in reverse chronological order", async function () {
    const { tipPost, creator } = await deployTipPostFixture();

    for (let i = 0; i < 5; i++) {
      await tipPost
        .connect(creator)
        .createPost(`https://picsum.photos/600/40${i}`, `Post ${i + 1}`);
    }

    const [pageOne, nextCursor] = await tipPost.getPostsPage(0n, 3n);
    expect(pageOne.length).to.equal(3);
    expect(pageOne[0].id).to.equal(5n);
    expect(pageOne[1].id).to.equal(4n);
    expect(pageOne[2].id).to.equal(3n);
    expect(nextCursor).to.equal(2n);

    const [pageTwo, finalCursor] = await tipPost.getPostsPage(nextCursor, 3n);
    expect(pageTwo.length).to.equal(2);
    expect(pageTwo[0].id).to.equal(2n);
    expect(pageTwo[1].id).to.equal(1n);
    expect(finalCursor).to.equal(0n);
  });

  it("escrows tips when creator cannot receive ETH", async function () {
    const { tipPost, liker } = await deployTipPostFixture();

    const rejectReceiverFactory = await ethers.getContractFactory("RejectEtherReceiver");
    const deployedRejectReceiver = await rejectReceiverFactory.deploy(
      await tipPost.getAddress(),
    );
    await deployedRejectReceiver.waitForDeployment();
    const rejectReceiver = RejectEtherReceiver__factory.connect(
      await deployedRejectReceiver.getAddress(),
      liker,
    );

    await rejectReceiver.createPost("https://picsum.photos/600/400", "I reject ETH tips");

    const likeCost = await tipPost.likeCost();

    await expect(tipPost.connect(liker).likePost(1n, { value: likeCost }))
      .to.emit(tipPost, "TipEscrowed")
      .withArgs(1n, await rejectReceiver.getAddress(), likeCost);

    const savedPost = await tipPost.posts(1n);
    expect(savedPost.likes).to.equal(1n);
    expect(savedPost.totalEarned).to.equal(likeCost);
    expect(await tipPost.totalEarnedByUser(await rejectReceiver.getAddress())).to.equal(likeCost);
    expect(await tipPost.pendingWithdrawals(await rejectReceiver.getAddress())).to.equal(likeCost);
  });

  it("withdraws escrowed tips successfully", async function () {
    const { tipPost, creator, liker } = await deployTipPostFixture();

    const rejectReceiverFactory = await ethers.getContractFactory("RejectEtherReceiver");
    const deployedRejectReceiver = await rejectReceiverFactory.deploy(
      await tipPost.getAddress(),
    );
    await deployedRejectReceiver.waitForDeployment();
    const rejectReceiverAddress = await deployedRejectReceiver.getAddress();
    const rejectReceiver = RejectEtherReceiver__factory.connect(
      rejectReceiverAddress,
      creator,
    );

    await rejectReceiver.createPost("https://picsum.photos/600/400", "Escrow this tip");
    const likeCost = await tipPost.likeCost();
    await tipPost.connect(liker).likePost(1n, { value: likeCost });

    const receiverBalanceBefore = await ethers.provider.getBalance(rejectReceiverAddress);

    await expect(rejectReceiver.withdrawEscrowedTips())
      .to.emit(tipPost, "Withdrawal")
      .withArgs(rejectReceiverAddress, likeCost);

    const receiverBalanceAfter = await ethers.provider.getBalance(rejectReceiverAddress);
    expect(receiverBalanceAfter - receiverBalanceBefore).to.equal(likeCost);
    expect(await tipPost.pendingWithdrawals(rejectReceiverAddress)).to.equal(0n);
  });

  it("rejects withdraw when no pending balance exists", async function () {
    const { tipPost, creator } = await deployTipPostFixture();

    await expect(tipPost.connect(creator).withdraw())
      .to.be.revertedWithCustomError(tipPost, "NoPendingWithdrawal");
  });

  it("blocks reentrant withdraw attempts", async function () {
    const { tipPost, creator, liker } = await deployTipPostFixture();

    await tipPost.connect(creator).createPost("https://picsum.photos/600/400", "Safe target post");

    const reentrantReceiverFactory = await ethers.getContractFactory("ReentrantWithdrawReceiver");
    const deployedReentrantReceiver = await reentrantReceiverFactory.deploy(
      await tipPost.getAddress(),
    );
    await deployedReentrantReceiver.waitForDeployment();
    const reentrantReceiverAddress = await deployedReentrantReceiver.getAddress();
    const reentrantReceiver = ReentrantWithdrawReceiver__factory.connect(
      reentrantReceiverAddress,
      creator,
    );

    await reentrantReceiver.createPost("https://picsum.photos/600/400", "Escrow then reenter");
    await reentrantReceiver.setTargetPostId(1n);

    const likeCost = await tipPost.likeCost();
    await tipPost.connect(liker).likePost(2n, { value: likeCost });

    expect(await tipPost.pendingWithdrawals(reentrantReceiverAddress)).to.equal(likeCost);

    await expect(reentrantReceiver.attackWithdraw())
      .to.emit(tipPost, "Withdrawal")
      .withArgs(reentrantReceiverAddress, likeCost);

    expect(await tipPost.pendingWithdrawals(reentrantReceiverAddress)).to.equal(0n);
    expect(await reentrantReceiver.reentryAttempted()).to.equal(true);
    expect(await reentrantReceiver.reentrySucceeded()).to.equal(false);
    expect((await tipPost.posts(1n)).likes).to.equal(0n);
  });
});
