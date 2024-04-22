import { Allo, AlloError, AlloOperation, Result, error } from "./allo";
import { WaitUntilIndexerSynced } from "./indexer";
import { IpfsUploader } from "./ipfs";
import { TransactionReceipt, TransactionSender, sendRawTransaction, success } from "./transaction-sender";
import {
  AlloAbi,
  Allo as AlloV2Contract,
  CreateProfileArgs,
  DirectGrantsStrategy,
  DirectGrantsStrategyTypes,
  DonationVotingMerkleDistributionDirectTransferStrategyAbi,
  DonationVotingMerkleDistributionStrategy,
  DonationVotingMerkleDistributionStrategyTypes,
  Registry,
  RegistryAbi,
  TransactionData,
} from "@allo-team/allo-v2-sdk";
import { AnyJson, Hex, RoundCategory, UpdateRoundParams, dateToEthereumTimestamp } from "./types";

export class AlloV2 implements Allo {
  private transactionSender: TransactionSender;
  private ipfsUploader: IpfsUploader;
  private waitUntilIndexerSynced: WaitUntilIndexerSynced;
  private chainId: number;
  private registry: Registry;
  private allo: AlloV2Contract;

  constructor(args: {
    chainId: number;
    transactionSender: TransactionSender;
    ipfsUploader: IpfsUploader;
    waitUntilIndexerSynced: WaitUntilIndexerSynced;
  }) {
    this.chainId = args.chainId;
    this.transactionSender = args.transactionSender;
    this.ipfsUploader = args.ipfsUploader;
    this.waitUntilIndexerSynced = args.waitUntilIndexerSynced;

    this.registry = new Registry({
      chain: this.chainId,
    });
    this.allo = new AlloV2Contract({
      chain: this.chainId,
    });
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
      let receipt: TransactionReceipt | null = null;

      const data = args.data;

      if (typeof args.roundId != "number") {
        return error(new AlloError("roundId must be number"));
      }

      if (!args.roundAddress) {
        return error(new AlloError("roundAddress must be provided"));
      }

      /** Upload roundMetadata ( includes applicationMetadata ) to IPFS */
     if (data.roundMetadata) {
        let updateArgs: { round: AnyJson; application?: AnyJson } = {
          round: data.roundMetadata,
        };
        if (data.applicationMetadata)
          updateArgs = { ...updateArgs, application: data.applicationMetadata };
        const ipfsResult = await this.ipfsUploader(updateArgs);

        emit("ipfs", ipfsResult);

        if (ipfsResult.type === "error") {
          return ipfsResult;
        }

        /** Note: the pool metadata always calls `this.allo.updatePoolMetadata` and not the strategy */
        const txUpdateMetadata = this.allo.updatePoolMetadata({
          poolId: BigInt(args.roundId),
          metadata: {
            protocol: 1n,
            pointer: ipfsResult.value,
          },
        });

        const txResult = await sendRawTransaction(this.transactionSender, {
          to: txUpdateMetadata.to,
          data: txUpdateMetadata.data,
          value: BigInt(txUpdateMetadata.value),
        });

        if (txResult.type === "error") {
          return error(txResult.error);
        }

        try {
          // wait for 1st transaction to be mined
          receipt = await this.transactionSender.wait(txResult.value);
        } catch (err) {
          const result = new AlloError("Failed to update metadata");
          emit("transactionStatus", error(result));
          return error(result);
        }
      }

      let updateTimestampTxn: TransactionData | null = null;

      /** Note: timestamps updates happen by calling the strategy contract directly `this.strategy.updatePoolTimestamps` */
      switch (args.strategy) {
        case RoundCategory.QuadraticFunding: {
          const strategyInstance = new DonationVotingMerkleDistributionStrategy(
            {
              chain: this.chainId,
              poolId: BigInt(args.roundId),
              address: args.roundAddress,
            }
          );

          if (
            data.roundStartTime &&
            data.roundEndTime &&
            data.applicationsStartTime &&
            data.applicationsEndTime
          ) {
            updateTimestampTxn = strategyInstance.updatePoolTimestamps(
              dateToEthereumTimestamp(data.applicationsStartTime),
              dateToEthereumTimestamp(data.applicationsEndTime),
              dateToEthereumTimestamp(data.roundStartTime),
              dateToEthereumTimestamp(data.roundEndTime)
            );
          }

          break;
        }
        case RoundCategory.Direct: {
          // NOTE: TEST AFTER CREATION WORKS ON UI

          const strategyInstance = new DirectGrantsStrategy({
            chain: this.chainId,
            poolId: BigInt(args.roundId),
            address: args.roundAddress,
          });

          if (data.applicationsStartTime && data.applicationsEndTime) {
            updateTimestampTxn = strategyInstance.getUpdatePoolTimestampsData(
              dateToEthereumTimestamp(data.applicationsStartTime),
              dateToEthereumTimestamp(data.applicationsEndTime)
            );
          }

          break;
        }

        default:
          throw new AlloError("Unsupported strategy");
      }

      if (updateTimestampTxn) {
        const timestampTxResult = await sendRawTransaction(
          this.transactionSender,
          {
            to: updateTimestampTxn.to,
            data: updateTimestampTxn.data,
            value: BigInt(updateTimestampTxn.value),
          }
        );

        if (timestampTxResult.type === "error") {
          return error(timestampTxResult.error);
        }

        try {
          // wait for 2nd transaction to be mined
          receipt = await this.transactionSender.wait(timestampTxResult.value);
        } catch (err) {
          const result = new AlloError("Failed to update timestamps");
          emit("transactionStatus", error(result));
          return error(result);
        }
      }

      if (!receipt) return error(new AlloError("No receipt found"));

      // note: we have 2 txns, allo.updatePoolMetadata and strategy.timestamp
      // handle the case where only 1 happens or both
      emit("transactionStatus", success(receipt));

      await this.waitUntilIndexerSynced({
        chainId: this.chainId,
        blockNumber: receipt.blockNumber,
      });

      emit("indexingStatus", success(void 0));

      return success(args.roundId);
    });
  }
}
