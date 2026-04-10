// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract TipPost is ReentrancyGuard {
    struct Post {
        uint256 id;
        address creator;
        string imageUrl;
        string caption;
        string metadataURI;
        uint256 likes;
        uint256 totalEarned;
        uint256 timestamp;
    }

    error EmptyImageUrl();
    error EmptyCaption();
    error PostNotFound();
    error CannotLikeOwnPost();
    error AlreadyLiked();
    error IncorrectTipAmount();
    error EmptyMetadataURI();
    error InvalidPageSize();
    error NoPendingWithdrawal();
    error WithdrawalTransferFailed();

    uint256 public postCount;
    uint256 public likeCost = 0.0001 ether;

    mapping(uint256 => Post) public posts;
    mapping(uint256 => mapping(address => bool)) public hasLiked;
    mapping(address => uint256) public totalEarnedByUser;
    mapping(address => uint256) public pendingWithdrawals;

    event PostCreated(
        uint256 indexed id,
        address indexed creator,
        string imageUrl,
        string caption,
        uint256 timestamp
    );

    event PostCreatedWithMetadata(
        uint256 indexed id,
        address indexed creator,
        string metadataURI,
        uint256 timestamp
    );

    event PostLiked(
        uint256 indexed id,
        address indexed liker,
        uint256 amount,
        uint256 newLikeCount,
        uint256 newTotalEarned
    );

    event TipEscrowed(uint256 indexed id, address indexed creator, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);

    function createPost(string calldata imageUrl, string calldata caption) external {
        if (bytes(imageUrl).length == 0) revert EmptyImageUrl();
        if (bytes(caption).length == 0) revert EmptyCaption();

        unchecked {
            postCount += 1;
        }

        posts[postCount] = Post({
            id: postCount,
            creator: msg.sender,
            imageUrl: imageUrl,
            caption: caption,
            metadataURI: "",
            likes: 0,
            totalEarned: 0,
            timestamp: block.timestamp
        });

        emit PostCreated(postCount, msg.sender, imageUrl, caption, block.timestamp);
    }

    function createPostWithMetadata(string calldata metadataURI) external {
        if (bytes(metadataURI).length == 0) revert EmptyMetadataURI();

        unchecked {
            postCount += 1;
        }

        posts[postCount] = Post({
            id: postCount,
            creator: msg.sender,
            imageUrl: "",
            caption: "",
            metadataURI: metadataURI,
            likes: 0,
            totalEarned: 0,
            timestamp: block.timestamp
        });

        emit PostCreatedWithMetadata(postCount, msg.sender, metadataURI, block.timestamp);
    }

    function likePost(uint256 postId) external payable nonReentrant {
        if (postId == 0 || postId > postCount) revert PostNotFound();
        if (msg.value != likeCost) revert IncorrectTipAmount();

        Post storage post = posts[postId];

        if (msg.sender == post.creator) revert CannotLikeOwnPost();
        if (hasLiked[postId][msg.sender]) revert AlreadyLiked();

        // Effects before interaction to minimize reentrancy risk.
        hasLiked[postId][msg.sender] = true;
        post.likes += 1;
        post.totalEarned += msg.value;
        totalEarnedByUser[post.creator] += msg.value;

        // External call after state updates.
        (bool sent, ) = payable(post.creator).call{value: msg.value}("");
        if (!sent) {
            pendingWithdrawals[post.creator] += msg.value;
            emit TipEscrowed(postId, post.creator, msg.value);
        }

        emit PostLiked(postId, msg.sender, msg.value, post.likes, post.totalEarned);
    }

    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NoPendingWithdrawal();

        pendingWithdrawals[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        if (!sent) {
            pendingWithdrawals[msg.sender] = amount;
            revert WithdrawalTransferFailed();
        }

        emit Withdrawal(msg.sender, amount);
    }

    function getAllPosts() external view returns (Post[] memory) {
        Post[] memory allPosts = new Post[](postCount);

        for (uint256 i = 1; i <= postCount; i++) {
            allPosts[i - 1] = posts[i];
        }

        return allPosts;
    }

    function getPostsPage(
        uint256 cursor,
        uint256 pageSize
    ) external view returns (Post[] memory page, uint256 nextCursor) {
        if (pageSize == 0) revert InvalidPageSize();

        if (postCount == 0) {
            return (new Post[](0), 0);
        }

        uint256 current = cursor == 0 ? postCount : cursor;
        if (current > postCount) {
            current = postCount;
        }

        uint256 available = current;
        uint256 count = pageSize < available ? pageSize : available;

        page = new Post[](count);
        uint256 id = current;

        for (uint256 i = 0; i < count; i++) {
            page[i] = posts[id];
            unchecked {
                id -= 1;
            }
        }

        nextCursor = id;
    }

    function checkLiked(uint256 postId, address user) external view returns (bool) {
        if (postId == 0 || postId > postCount) {
            return false;
        }

        return hasLiked[postId][user];
    }
}
