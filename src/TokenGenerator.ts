import { sign, SignOptions, verify, Algorithm } from 'jsonwebtoken'

export interface JWTSigningOptions {
    expirationDate: number
    algorithm?: Algorithm
    privateKey: string | Buffer
}

export interface JWTDecodingOptions {
    publicKey: string | Buffer
    algorithms?: [Algorithm]
}

export class TokenGenerator {
    public static generateJWT = <P>(
        payload: P,
        options: JWTSigningOptions,
    ): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            try {
                const signOptions: SignOptions = { algorithm: options.algorithm }
                sign(
                    { ...payload, exp: options.expirationDate },
                    options.privateKey,
                    signOptions,
                    (error, token) => {
                        error ? reject(error) : resolve(token)
                    },
                )
            } catch (error) {
                reject(error)
            }
        })
    }

    public static verifyJWT = <P extends object>(
        token: string,
        options: JWTDecodingOptions,
    ): Promise<P> => {
        return new Promise<P>((resolve, reject) => {
            try {
                const decodingOptions = {
                    algorithms: options.algorithms,
                }

                verify(token, options.publicKey, decodingOptions, (error, decoded) => {
                    error ? reject(error) : resolve(decoded as P)
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}
