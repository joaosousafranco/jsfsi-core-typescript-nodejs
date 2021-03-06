import mung from 'express-mung'
import { Request, Response, Application } from 'express'
import { Link, InternalServerError } from '@jsfsi-core/typescript-cross-platform'
import { Logger } from '../../Logger'

// TODO: Improve this file to use types instead of any

let hateoasParser: HateoasParser

export type HateoasRules = {
  [entityType: string]: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entity: any,
    request?: Request,
    response?: Response,
  ) => Link | Link[]
}

export class SimpleHateoasRule extends Link {}

export const setupHateoasRules = (application: Application, rules: HateoasRules) => {
  const rulesCollection = {
    ...rules,
    SimpleHateoasRule: (entity: SimpleHateoasRule, request: Request) => {
      return {
        ...entity,
        href: `${request.protocol}://${request.get('Host')}${entity.href}`,
      } as Link
    },
  }
  hateoasParser = new HateoasParser(rulesCollection)
  application.use(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mung.json((body: any, request, response) => {
      return hateoasParser.parseLinks(body, request, response)
    }),
  )
}

export class HateoasParser {
  constructor(private rules: HateoasRules) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public parseLinks = (body: any, request?: Request, response?: Response) => {
    const parsedBody = Object.assign({}, body)

    if (parsedBody) {
      Object.keys(parsedBody).forEach((key) => {
        if (key === '_links') {
          this.parseBodyLinks(parsedBody._links, request, response)
        } else {
          if (
            Array.isArray(parsedBody[key]) &&
            typeof parsedBody[key]?.[0] === 'object'
          ) {
            parsedBody[key] = (parsedBody[key] as Array<unknown>).map((item) =>
              this.parseLinks(item, request, response),
            )
          } else if (
            typeof parsedBody[key] === 'object' &&
            !Array.isArray(parsedBody[key])
          ) {
            parsedBody[key] = this.parseLinks(parsedBody[key], request, response)
          }
        }
      })
    }

    return parsedBody
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private parseBodyLinks = (links: any, request?: Request, response?: Response) => {
    Object.keys(links).forEach((key) => {
      const entity = links[key]
      links[key] = this.processEntity(entity, request, response)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processEntity = (entity: any, request?: Request, response?: Response) => {
    const entityClass = entity?.constructor?.name
    if (!this.rules[entityClass] && entityClass !== Link.name) {
      Logger.error(
        `The entity class ${entityClass} doesn't have a HateoasRule defined: ${JSON.stringify(
          entity || {},
        )}`,
      )
      throw new InternalServerError(
        `The entity class ${entityClass} doesn't have a HateoasRule defined: ${JSON.stringify(
          entity || {},
        )}`,
      )
    }

    return this.rules[entityClass]
      ? this.rules[entityClass](entity, request, response)
      : entity
  }
}
