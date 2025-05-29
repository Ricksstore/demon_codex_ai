import { ObjectifyError } from '@idl/error-shared';
import { ChildProcess } from 'child_process';

import {
  FromIDLMachineNotificationParams,
  FromIDLMachineNotifications,
} from './from-machine/from-machine.notifications.interface';
import {
  FromIDLMachineRequestHandler,
  FromIDLMachineRequestParams,
  FromIDLMachineRequestResponse,
  FromIDLMachineRequests,
} from './from-machine/from-machine.requests.interface';
import { IRequestHandlers, IRequestResolver } from './idl-machine.interface';
import {
  JSONRPCNotification,
  JSONRPCRequest,
  JSONRPCResponse,
} from './json-rpc.interface';
import { OutputQueue } from './output-queue';
import {
  ToIDLMachineNotificationParams,
  ToIDLMachineNotifications,
} from './to-machine/to-machine.notifications.interface';
import {
  ToIDLMachineRequestParams,
  ToIDLMachineRequestResponse,
  ToIDLMachineRequests,
} from './to-machine/to-machine.requests.interface';

/**
 * Class to talk to the IDL machine
 */
export class IDLMachine {
  /**
   * Track any request handlers that we may need to respond to manually
   *
   * These supercede the defaults we register
   */
  _customHandlers: {
    [T in FromIDLMachineRequests]?: FromIDLMachineRequestHandler<T>;
  } = {};

  /** Message IDs */
  id = 1;

  /**
   * Message handler from the IDL Machine
   */
  private _onMessage = async (msg: string) => {
    /** Parsed message */
    let parsed: any;

    /**
     * Try to parse and properly handle errors
     */
    try {
      /** Parse */
      parsed = JSON.parse(msg);
    } catch (err) {
      console.log(
        `Error while parsing message from server, partial message below`
      );
      console.log(msg.slice(0, 50));
      console.log(err);
      return;
    }

    /**
     * TODO: Listen for internal errors from IDL Machine and alert user
     * as noted
     */

    switch (true) {
      /**
       * Response from IDL Machine with an error
       */
      case (parsed as JSONRPCResponse).error !== undefined:
        if ((parsed as JSONRPCResponse).id in this.resolvers) {
          this.resolvers[(parsed as JSONRPCResponse).id].reject(
            (parsed as JSONRPCResponse).error
          );
        }
        break;

      /**
       * Response from IDL Machine with a result
       */
      case (parsed as JSONRPCResponse).result !== undefined:
        if ((parsed as JSONRPCResponse).id in this.resolvers) {
          this.resolvers[(parsed as JSONRPCResponse).id].resolve(
            (parsed as JSONRPCResponse).result
          );
        }
        break;

      /**
       * Request from the IDL Machine
       *
       * TODO
       */
      case (parsed as JSONRPCRequest).id !== undefined:
        /**
         * Check for handler
         */
        if ((parsed as JSONRPCRequest).method in this.handlers.requests) {
          /**
           * Determine how we handle the request
           */
          switch (true) {
            /**
             * See if theres a custom handler
             */
            case (parsed as JSONRPCRequest).method in this._customHandlers:
              try {
                /**
                 * Get what we send back
                 */
                const result = await this._customHandlers[
                  (parsed as JSONRPCRequest).method
                ]((parsed as JSONRPCRequest).params);

                // send message
                this._writeResponse((parsed as JSONRPCRequest).id, result);
              } catch (err) {
                console.log(
                  `Error responding to request with custom handler`,
                  err
                );
                const resp: JSONRPCResponse = {
                  jsonrpc: '2.0',
                  id: (parsed as JSONRPCRequest).id,
                  error: {
                    code: -32000,
                    message: JSON.stringify(ObjectifyError(err)),
                  },
                };
                this.idl.stdin.write(JSON.stringify(resp));
              }
              break;

            /**
             * Otherwise default to an item we have registered
             */
            default:
              try {
                /**
                 * Get what we send back
                 */
                const result = await this.handlers.requests[
                  (parsed as JSONRPCRequest).method
                ]((parsed as JSONRPCRequest).params);

                // send message
                this._writeResponse((parsed as JSONRPCRequest).id, result);
              } catch (err) {
                console.log(`Error responding to request`, err);
                const resp: JSONRPCResponse = {
                  jsonrpc: '2.0',
                  id: (parsed as JSONRPCRequest).id,
                  error: {
                    code: -32000,
                    message: JSON.stringify(ObjectifyError(err)),
                  },
                };
                this.idl.stdin.write(JSON.stringify(resp));
              }
              break;
          }
        } else {
          console.log(`Unhandled request from IDL machine`, parsed);
          /**
           * Alert if we have no handler to send a response back
           */
          const resp: JSONRPCResponse = {
            jsonrpc: '2.0',
            id: (parsed as JSONRPCRequest).id,
            error: {
              code: -32601,
              message: 'Unhandled method',
            },
          };
          this.idl.stdin.write(JSON.stringify(resp));
        }
        break;

      /**
       * Notification from the IDL Machine
       */
      default:
        if (
          (parsed as JSONRPCNotification).method in this.handlers.notifications
        ) {
          try {
            await this.handlers.notifications[
              (parsed as JSONRPCNotification).method
            ]((parsed as JSONRPCNotification).params);
          } catch (err) {
            console.log(`Error responding to notification`, err);
          }
        } else {
          console.log(
            `Unhandled notification "${
              (parsed as JSONRPCNotification).method
            }" from IDL Machine`
          );
        }
        break;
    }
  };

  /**
   * Create queue to handle output from IDL
   *
   * Makes sure we process one message/chunk at a time and
   * dont try to parse/process everything
   */
  private _queue = new OutputQueue(this._onMessage);

  /**
   * Handlers for events from servers
   */
  private handlers: IRequestHandlers = {
    notifications: {},
    requests: {},
  };

  /** IDL process */
  private idl: ChildProcess;

  /**
   * Callbacks for promises
   */
  private resolvers: IRequestResolver = {};

  constructor(idl: ChildProcess) {
    this.idl = idl;

    // handle output from IDL
    idl.stdout.on('data', (data: Buffer) => {
      this._queue.handleOutput(data.toString());
    });
  }

  /**
   * Listen for notifications from the IDL Machine
   */
  onNotification<T extends FromIDLMachineNotifications>(
    notification: T,
    cb: (params: FromIDLMachineNotificationParams<T>) => Promise<void> | void
  ) {
    this.handlers.notifications[notification] = cb;
  }

  /**
   * Listen and respond to requests from the IDL Machine
   */
  onRequest<T extends FromIDLMachineRequests>(
    request: T,
    cb: (
      params: FromIDLMachineRequestParams<T>
    ) =>
      | FromIDLMachineRequestResponse<T>
      | Promise<FromIDLMachineRequestResponse<T>>
  ) {
    this.handlers.requests[request] = cb;
  }

  /**
   * Add a custom request handler for a given request from the IDL Machine
   *
   * Only one handler can be registered at a time for any event
   */
  registerRequestHandler<T extends FromIDLMachineRequests>(
    event: T,
    handler: FromIDLMachineRequestHandler<T>
  ) {
    this._customHandlers[event] = handler as any;
  }

  /**
   * Send a notification to the IDL Machine
   */
  async sendNotification<T extends ToIDLMachineNotifications>(
    notification: T,
    params: ToIDLMachineNotificationParams<T>
  ) {
    this._writeNotification(notification, params);
  }

  /**
   * Send a request to the IDL Machine
   */
  async sendRequest<T extends ToIDLMachineRequests>(
    request: T,
    params: ToIDLMachineRequestParams<T>
  ): Promise<ToIDLMachineRequestResponse<T>> {
    return new Promise((resolve, reject) => {
      /**
       * Get ID for this message
       */
      const id = this.id++;

      // save our promise resolvers
      this.resolvers[id] = { resolve, reject };

      // send request
      this._writeRequest(this.id++, request, params);
    });
  }

  /**
   * Writes a JSON RPC notification message
   */
  private _writeNotification(method: string, params: any) {
    this.idl.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
      })
    );
  }

  /**
   * Writes a JSON RPC notification message
   */
  private _writeRequest(id: number, method: string, params: any) {
    this.idl.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      })
    );
  }

  /**
   * Writes out a JSON RPC response to the IDL Machine
   */
  private _writeResponse(id: number, result: any) {
    this.idl.stdin.write(
      JSON.stringify({
        jsonrpc: '2.0',
        id,
        result,
      })
    );
  }
}
