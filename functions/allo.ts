import { Signer } from "@ethersproject/abstract-signer";
import { Address, Hex, PublicClient } from "viem";
import { RoundCategory, UpdateRoundParams } from "./types";
import { AlloOperation } from "./operation";

export type Result<T> =
  | { type: "success"; value: T }
  | { type: "error"; error: Error };

export function error<T>(error: Error): Result<T> {
  return { type: "error", error };
}

export interface TransactionReceipt {
  transactionHash: Hex;
  blockHash: Hex;
  blockNumber: bigint;
  logs: Array<{
    data: Hex;
    topics: Hex[];
  }>;
  status: "success" | "reverted";
}

/**
 * Represents the common interface for interacting with Allo contracts.
 * This interface provides methods to perform various operations related to Allo contracts.
 * Each operation returns an `AlloOperation` which is an event emitter that reports the progress
 * of the operation and resolves to a final result.
 */
export interface Allo {
  editRound: (args: {
    roundId: Hex | number;
    roundAddress?: Hex;
    data: UpdateRoundParams;
    strategy?: RoundCategory;
  }) => AlloOperation<
    Result<Hex | number>,
    {
      ipfs: Result<string>;
      transaction: Result<Hex>;
      transactionStatus: Result<TransactionReceipt>;
      indexingStatus: Result<void>;
    }
  >;
}

export { AlloOperation };

/**
 * Represents an error that occurred while interacting with Allo.
 *
 * @remarks
 *
 * This error is thrown when an error occurs while interacting with Allo contracts.
 *
 * @public
 *
 * @extends Error
 *
 * @example
 *
 * ```typescript
 * try {
 *  const result = await allo.createProject({ name: "Project", metadata: {} });
 * } catch (error) {
 *   if (error instanceof AlloError) {
 *     console.error("An error occurred while creating the project", error);
 *   }
 * }
 * ```
 */
export class AlloError extends Error {
  constructor(message: string, public inner: unknown = undefined) {
    super(message);

    this.name = "AlloError";
  }
}
