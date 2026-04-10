// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./TipPost.sol";

contract RejectEtherReceiver {
    TipPost public immutable tipPost;
    bool private acceptingWithdrawal;

    constructor(address tipPostAddress) {
        tipPost = TipPost(tipPostAddress);
    }

    function createPost(string calldata imageUrl, string calldata caption) external {
        tipPost.createPost(imageUrl, caption);
    }

    function withdrawEscrowedTips() external {
        acceptingWithdrawal = true;
        tipPost.withdraw();
        acceptingWithdrawal = false;
    }

    receive() external payable {
        if (!acceptingWithdrawal) {
            revert("I do not accept ETH");
        }
    }
}
