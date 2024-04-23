import { Allo, AlloError, AlloOperation, Result, error } from "./allo";
import { WaitUntilIndexerSynced } from "./indexer";
import { IpfsUploader } from "./ipfs";
import {
  TransactionReceipt,
  TransactionSender,
  sendRawTransaction,
  success,
} from "./transaction-sender";
import {
  Hex,
  RoundCategory,
  UpdateAction,
  UpdateRoundParams,
  dateToEthereumTimestamp,
} from "./types";
import { Address } from "viem";
import { ChainId, parseChainId } from "./utils";
import { TransactionBuilder } from "./transaction-builder";

// TODO: get chains, roundFactoryMap & projectRegistryMap from the indexer/a json file
type ChainIdToStringMap = Record<ChainId, Address>;

export const projectRegistryMap: ChainIdToStringMap = {
  [ChainId.MAINNET]: "0x03506eD3f57892C85DB20C36846e9c808aFe9ef4",
  [ChainId.OPTIMISM_MAINNET_CHAIN_ID]:
    "0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174",
  [ChainId.FANTOM_MAINNET_CHAIN_ID]:
    "0x8e1bD5Da87C14dd8e08F7ecc2aBf9D1d558ea174",
  [ChainId.FANTOM_TESTNET_CHAIN_ID]:
    "0x984749e408FF0446d8ADaf20E293F2F299396631",
  [ChainId.PGN_TESTNET]: "0x6294bed5B884Ae18bf737793Ef9415069Bf4bc11",
  [ChainId.PGN]: "0xDF9BF58Aa1A1B73F0e214d79C652a7dd37a6074e",
  [ChainId.ARBITRUM]: "0x73AB205af1476Dc22104A6B8b3d4c273B58C6E27",
  [ChainId.ARBITRUM_GOERLI]: "0x0CD135777dEaB6D0Bb150bDB0592aC9Baa4d0871",
  [ChainId.FUJI]: "0x8918401DD47f1645fF1111D8E513c0404b84d5bB",
  [ChainId.AVALANCHE]: "0xDF9BF58Aa1A1B73F0e214d79C652a7dd37a6074e",
  [ChainId.POLYGON]: "0x5C5E2D94b107C7691B08E43169fDe76EAAB6D48b",
  [ChainId.POLYGON_MUMBAI]: "0x545B282A50EaeA01A619914d44105437036CbB36",
  [ChainId.ZKSYNC_ERA_MAINNET_CHAIN_ID]:
    "0xe6CCEe93c97E20644431647B306F48e278aFFdb9",
  [ChainId.ZKSYNC_ERA_TESTNET_CHAIN_ID]:
    "0xb0F4882184EB6e3ed120c5181651D50719329788",
  [ChainId.BASE]: "0xA78Daa89fE9C1eC66c5cB1c5833bC8C6Cb307918",
};
export const roundFactoryMap: ChainIdToStringMap = {
  [ChainId.MAINNET]: "0x9Cb7f434aD3250d1656854A9eC7A71EceC6eE1EF",
  [ChainId.OPTIMISM_MAINNET_CHAIN_ID]:
    "0x04E753cFB8c8D1D7f776f7d7A033740961b6AEC2",
  [ChainId.FANTOM_MAINNET_CHAIN_ID]:
    "0xfb08d1fD3a7c693677eB096E722ABf4Ae63B0B95",
  [ChainId.FANTOM_TESTNET_CHAIN_ID]:
    "0x8AdFcF226dfb2fA73788Ad711C958Ba251369cb3",
  [ChainId.PGN_TESTNET]: "0x0479b9DA9f287539FEBd597350B1eBaEBF7479ac",
  [ChainId.PGN]: "0x8AdFcF226dfb2fA73788Ad711C958Ba251369cb3",
  [ChainId.ARBITRUM_GOERLI]: "0xdf25423c9ec15347197Aa5D3a41c2ebE27587D59",
  [ChainId.ARBITRUM]: "0xF2a07728107B04266015E67b1468cA0a536956C8",
  [ChainId.FUJI]: "0x3615d870d5B760cea43693ABED70Cd8A9b59b3d8",
  [ChainId.AVALANCHE]: "0x8eC471f30cA797FD52F9D37A47Be2517a7BD6912",
  [ChainId.POLYGON]: "0x5ab68dCdcA37A1C2b09c5218e28eB0d9cc3FEb03",
  [ChainId.POLYGON_MUMBAI]: "0xE1c5812e9831bc1d5BDcF50AAEc1a47C4508F3fA",
  [ChainId.ZKSYNC_ERA_MAINNET_CHAIN_ID]:
    "0xF3B5a0d59C6292BD0e4f8Cf735EEF52b98f428E6",
  [ChainId.ZKSYNC_ERA_TESTNET_CHAIN_ID]:
    "0x0Bb6e2dfEaef0Db5809B3979717E99e053Cbae72",
  [ChainId.BASE]: "0xc7722909fEBf7880E15e67d563E2736D9Bb9c1Ab",
};

export class AlloV1 implements Allo {
  private readonly projectRegistryAddress: Address;
  private readonly roundFactoryAddress: Address;
  private readonly transactionSender: TransactionSender;
  private readonly ipfsUploader: IpfsUploader;
  private readonly waitUntilIndexerSynced: WaitUntilIndexerSynced;
  private readonly chainId: ChainId;

  constructor(args: {
    chainId: number;
    transactionSender: TransactionSender;
    ipfsUploader: IpfsUploader;
    waitUntilIndexerSynced: WaitUntilIndexerSynced;
  }) {
    this.chainId = parseChainId(args.chainId);
    this.transactionSender = args.transactionSender;
    this.projectRegistryAddress = projectRegistryMap[this.chainId];
    this.roundFactoryAddress = roundFactoryMap[this.chainId];
    this.ipfsUploader = args.ipfsUploader;
    this.waitUntilIndexerSynced = args.waitUntilIndexerSynced;
  }

  editRound(args: {
    roundId: Hex | number;
    roundAddress?: Hex;
    data: UpdateRoundParams;
    strategy?: RoundCategory;
  }): AlloOperation<
    Result<Hex | number>,
    {
      ipfs: Result<string>;
      transaction: Result<Hex>;
      transactionStatus: Result<TransactionReceipt>;
      indexingStatus: Result<void>;
    }
  > {
    return new AlloOperation(async ({ emit }) => {
      if (typeof args.roundId == "number") {
        return error(new AlloError("roundId must be a number"));
      }
      const transactionBuilder = new TransactionBuilder(args.roundId);

      const data = args.data;
      // upload application metadata to IPFS + add to transactionBuilder
      if (data.applicationMetadata) {
        const ipfsResult: Result<string> = await this.ipfsUploader(
          data.applicationMetadata
        );
        emit("ipfs", ipfsResult);
        if (ipfsResult.type === "error") {
          return ipfsResult;
        }
        transactionBuilder.add(UpdateAction.UPDATE_APPLICATION_META_PTR, [
          { protocol: 1, pointer: ipfsResult.value },
        ]);
      }
      // upload round metadata to IPFS + add to transactionBuilder
      if (data.roundMetadata) {
        const ipfsResult: Result<string> = await this.ipfsUploader(
          data.roundMetadata
        );
        emit("ipfs", ipfsResult);
        if (ipfsResult.type === "error") {
          return ipfsResult;
        }
        transactionBuilder.add(UpdateAction.UPDATE_ROUND_META_PTR, [
          { protocol: 1, pointer: ipfsResult.value },
        ]);
      }

      if (!data.roundMetadata && !data.applicationMetadata) {
        // NOTE : This is for the progreds modal
        const voidEmit: Result<string> = success("");
        emit("ipfs", voidEmit);
      }

      if (data.matchAmount) {
        // NOTE : This is parseUnits format of the token
        transactionBuilder.add(UpdateAction.UPDATE_MATCH_AMOUNT, [
          data.matchAmount,
        ]);
      }

      /* Special case - if the application period or round has already started, and we are editing times,
       * we need to set newApplicationsStartTime and newRoundStartTime to something bigger than the block timestamp.
       * This won't actually update the values, it's done just to pass the checks in the contract
       * (and to confuse the developer).
       *  https://github.com/allo-protocol/allo-contracts/blob/9c50f53cbdc2844fbf3cfa760df438f6fe3f0368/contracts/round/RoundImplementation.sol#L339C1-L339C1
       **/
      if (
        data.roundStartTime &&
        data.roundEndTime &&
        data.applicationsStartTime &&
        data.applicationsEndTime
      ) {
        if (Date.now() > data.applicationsStartTime.getTime()) {
          data.applicationsStartTime = new Date(
            data.applicationsEndTime.getTime() - 1000000
          );
        }
        if (Date.now() > data.roundStartTime.getTime()) {
          data.roundStartTime = new Date(
            data.applicationsEndTime.getTime() - 1000000
          );
        }

        transactionBuilder.add(UpdateAction.UPDATE_ROUND_START_AND_END_TIMES, [
          (data.applicationsStartTime.getTime() / 1000).toFixed(0),
          (data.applicationsEndTime.getTime() / 1000).toFixed(0),
          (data.roundStartTime.getTime() / 1000).toFixed(0),
          (data.roundEndTime.getTime() / 1000).toFixed(0),
        ]);
      }
      const transactionBody = transactionBuilder.generate();

      const txResult = await sendRawTransaction(this.transactionSender, {
        to: transactionBody.to,
        data: transactionBody.data,
        value: BigInt(transactionBody.value),
      });

      emit("transaction", txResult);
      if (txResult.type === "error") {
        return error(txResult.error);
      }

      let receipt: TransactionReceipt;

      try {
        receipt = await this.transactionSender.wait(txResult.value);
        emit("transactionStatus", success(receipt));
      } catch (err) {
        console.log(err);
        const result = new AlloError("Failed to update round");
        emit("transactionStatus", error(result));
        return error(result);
      }

      await this.waitUntilIndexerSynced({
        chainId: this.chainId,
        blockNumber: receipt.blockNumber,
      });

      emit("indexingStatus", success(undefined));

      return success(args.roundId);
    });
  }
}
