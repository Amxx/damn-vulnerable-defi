pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

contract DamnBatchExecutor {
    constructor(address[] memory targets, uint256[] memory values, bytes[] memory datas) public payable {
        for (uint256 i = 0; i < targets.length; ++i) {
            (bool success,) = targets[i].call{value: values[i]}(datas[i]);
            require(success, 'call-failled');
        }
    }
}
