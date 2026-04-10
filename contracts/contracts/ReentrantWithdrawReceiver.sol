// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TipPost.sol";

contract ReentrantWithdrawReceiver {
    TipPost public immutable tipPost;
    uint256 public targetPostId;
    bool public reentryAttempted;
    bool public reentrySucceeded;
    bool private attacking;

    constructor(address tipPostAddress) {
        tipPost = TipPost(tipPostAddress);
    }

    function createPost(string calldata imageUrl, string calldata caption) external {
        tipPost.createPost(imageUrl, caption);
    }

    function setTargetPostId(uint256 postId) external {
        targetPostId = postId;
    }

    function attackWithdraw() external {
        attacking = true;
        tipPost.withdraw();
        attacking = false;
    }

    receive() external payable {
        if (!attacking) {
            revert("I do not accept direct tips");
        }

        reentryAttempted = true;

        try tipPost.likePost{value: msg.value}(targetPostId) {
            reentrySucceeded = true;
        } catch {
            reentrySucceeded = false;
        }
    }
}
