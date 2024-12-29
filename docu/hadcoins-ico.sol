// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;

contract CoinICO {
  // max number of coins available for sale
  uint public maxCoins = 1000000;

  // the USD to coins conversion rate
  uint public usdToCoins = 10;

  // total number of coins that have been bought by the investor
  uint public totalCoinsBought = 0;

  // mapping from the investor address to its equity in coins
  mapping(address => uint) public equityCoins;

  // mapping from the investor address to its equity in USD
  mapping(address => uint) public equityUsd;

  // checking if an investor can by coins
  modifier canByCoins(uint usdInvested) {
    require(usdInvested * usdToCoins + totalCoinsBought <= maxCoins);
    _;
  }

  // getting the equity in coins of an investor
  function equityInCoins(address investor) external view returns (uint) {
    return equityCoins[investor];
  }

  // getting the equity in USD of an investor
  function equityInUsd(address investor) external view returns (uint) {
    return equityUsd[investor];
  }

  // buying coins
  function buyCoins(address investor, uint usdInvested) external
  canByCoins(usdInvested) {
    uint coinsBought = usdInvested * usdToCoins;
    equityCoins[investor] += coinsBought;
    equityUsd[investor] =  equityCoins[investor] / usdToCoins;
    totalCoinsBought += coinsBought;
  }

  // selling coins
  function sellCoins(address investor, uint coinsToSell) external {
    equityCoins[investor] -= coinsToSell;
    equityUsd[investor] =  equityCoins[investor] / usdToCoins;
    totalCoinsBought -= coinsToSell;
  }
}
