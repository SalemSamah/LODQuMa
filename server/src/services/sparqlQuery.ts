import { newEngine } from "@comunica/actor-init-sparql";
import {
  containerQueryLimit,
  dbo,
  dbp,
  foaf,
  innerQueryLimit,
  object,
  organisationDomain,
  personDomain,
  predicate,
  subject,
  type,
  variable,
  wikiPageExternalLink,
  wikiPageID,
  wikiPageRevisionID,
  wikiPageWikiLink,
  workDomain,
} from "@shared/constants";
import {
  default as SparqlGenerator,
  IriTerm,
  SparqlQuery,
  Variable,
} from "sparqljs";
import { LOCALNAMESPACES } from "src/config/SparqlQuery";

const myEngine = newEngine();
const generator = SparqlGenerator.Generator;

const execQuey = async (
  domain: string,
  containerQueryOffset: number | undefined
) => {
  const result = await myEngine.query(
    generateSparql(domain, containerQueryOffset),
    {
      sources: ["https://dbpedia.org/sparql"],
    }
  );
  return result;
};

const generateSparql = (
  domain: string,
  containerQueryOffset: number | undefined
) => {
  const query: SparqlQuery = queryBuilder(domain, containerQueryOffset);
  const generatedQuery = new generator().stringify(query);

  return generatedQuery;
};

const queryBuilder = (
  domain: string,
  containerQueryOffset: number | undefined
): SparqlQuery => {
  let domainFilter: IriTerm[] = [];
  switch (domain) {
    case "work":
      domainFilter = workDomain;
      break;
    case "person":
      domainFilter = personDomain;
      break;
    case "organisation":
      domainFilter = organisationDomain;
  }

  const query: SparqlQuery = {
    queryType: "SELECT",
    variables: [subject as Variable, predicate as Variable, object as Variable],
    where: [
      {
        type: "bgp",
        triples: [
          {
            subject,
            predicate,
            object,
          },
        ],
      },
      {
        type: "filter",
        expression: {
          type: "operation",
          operator: "||",
          args: [
            {
              type: "operation",
              operator: "||",
              args: [
                {
                  type: "operation",
                  operator: "strstarts",
                  args: [
                    {
                      type: "operation",
                      operator: "str",
                      args: [predicate],
                    },
                    {
                      type: "operation",
                      operator: "str",
                      args: [dbo],
                    },
                  ],
                },
                {
                  type: "operation",
                  operator: "strstarts",
                  args: [
                    {
                      type: "operation",
                      operator: "str",
                      args: [predicate],
                    },
                    {
                      type: "operation",
                      operator: "str",
                      args: [dbp],
                    },
                  ],
                },
              ],
            },
            {
              type: "operation",
              operator: "strstarts",
              args: [
                {
                  type: "operation",
                  operator: "str",
                  args: [predicate],
                },
                {
                  type: "operation",
                  operator: "str",
                  args: [foaf],
                },
              ],
            },
          ],
        },
      },
      {
        type: "filter",
        expression: {
          type: "operation",
          operator: "&&",
          args: [
            {
              type: "operation",
              operator: "&&",
              args: [
                {
                  type: "operation",
                  operator: "&&",
                  args: [
                    {
                      type: "operation",
                      operator: "&&",
                      args: [
                        {
                          type: "operation",
                          operator: "!",
                          args: [
                            {
                              type: "operation",
                              operator: "contains",
                              args: [
                                {
                                  type: "operation",
                                  operator: "str",
                                  args: [predicate],
                                },
                                wikiPageWikiLink,
                              ],
                            },
                          ],
                        },
                        {
                          type: "operation",
                          operator: "!",
                          args: [
                            {
                              type: "operation",
                              operator: "contains",
                              args: [
                                {
                                  type: "operation",
                                  operator: "str",
                                  args: [predicate],
                                },
                                wikiPageExternalLink,
                              ],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: "operation",
                      operator: "!",
                      args: [
                        {
                          type: "operation",
                          operator: "contains",
                          args: [
                            {
                              type: "operation",
                              operator: "str",
                              args: [predicate],
                            },
                            wikiPageID,
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: "operation",
                  operator: "!",
                  args: [
                    {
                      type: "operation",
                      operator: "contains",
                      args: [
                        {
                          type: "operation",
                          operator: "str",
                          args: [predicate],
                        },
                        wikiPageRevisionID,
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: "operation",
              operator: "!",
              args: [
                {
                  type: "operation",
                  operator: "contains",
                  args: [
                    {
                      type: "operation",
                      operator: "str",
                      args: [predicate],
                    },
                    wikiPageWikiLink,
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        type: "group",
        patterns: [
          {
            queryType: "SELECT",
            distinct: true,
            variables: [subject],
            where: [
              {
                type: "bgp",
                triples: [
                  {
                    subject,
                    predicate: type,
                    object: variable,
                  },
                ],
              },
              {
                type: "filter",
                expression: {
                  type: "operation",
                  operator: "in",
                  args: [variable, domainFilter],
                },
              },
            ],
            limit: innerQueryLimit,
            type: "query",
            prefixes: {},
          },
        ],
      },
    ],
    limit: containerQueryLimit,
    offset: containerQueryOffset,
    type: "query",
    prefixes: LOCALNAMESPACES,
  };

  return query;
};
export { execQuey, generateSparql };
