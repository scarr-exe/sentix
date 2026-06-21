// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SentixLogger {

    struct BacktestRecord {
        address user;
        string  symbol;
        string  timeframe;
        string  period;
        string  strategyText;
        int256  totalPnLBps;
        uint256 winRateBps;
        uint256 totalTrades;
        uint256 timestamp;
    }

    BacktestRecord[] private _records;

    event BacktestLogged(
        address indexed user,
        string  symbol,
        string  timeframe,
        int256  totalPnLBps,
        uint256 winRateBps,
        uint256 totalTrades,
        uint256 timestamp,
        uint256 recordIndex
    );

    function logBacktest(
        string  calldata symbol,
        string  calldata timeframe,
        string  calldata period,
        string  calldata strategyText,
        int256           totalPnLBps,
        uint256          winRateBps,
        uint256          totalTrades
    ) external {
        require(bytes(symbol).length > 0,      "symbol required");
        require(bytes(strategyText).length > 0, "strategyText required");
        require(winRateBps <= 10_000,           "winRateBps out of range");

        uint256 index = _records.length;

        _records.push(BacktestRecord({
            user:         msg.sender,
            symbol:       symbol,
            timeframe:    timeframe,
            period:       period,
            strategyText: strategyText,
            totalPnLBps:  totalPnLBps,
            winRateBps:   winRateBps,
            totalTrades:  totalTrades,
            timestamp:    block.timestamp
        }));

        emit BacktestLogged(
            msg.sender,
            symbol,
            timeframe,
            totalPnLBps,
            winRateBps,
            totalTrades,
            block.timestamp,
            index
        );
    }

    function totalRecords() external view returns (uint256) {
        return _records.length;
    }

    function getRecord(uint256 index)
        external
        view
        returns (BacktestRecord memory)
    {
        require(index < _records.length, "index out of bounds");
        return _records[index];
    }

    function getRecordsByUser(address user)
        external
        view
        returns (BacktestRecord[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < _records.length; i++) {
            if (_records[i].user == user) count++;
        }

        BacktestRecord[] memory result = new BacktestRecord[](count);
        uint256 j = 0;
        for (uint256 i = 0; i < _records.length; i++) {
            if (_records[i].user == user) {
                result[j] = _records[i];
                j++;
            }
        }

        return result;
    }
}