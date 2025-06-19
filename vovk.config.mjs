// @ts-check
import _ from 'lodash';

/** @type {(str: string) => [string, string]} */
function getOperationInfo(str) {
  // Match version like v1, v2, v3, etc.
  const versionMatch = str.match(/^(.*?_v\d+)/);
  if (!versionMatch) return ['ERROR', 'ERROR'];

  const versionPart = versionMatch[1]; // 'options_v1'
  const rest = str.slice(versionPart.length + 1); // skip past the underscore after version

  // Convert version part to PascalCase
  const pascalCaseVersion = _.startCase(versionPart).replace(/ /g, '');

  // Convert rest to camelCase
  const camelCaseRest = _.camelCase(rest);

  return [pascalCaseVersion, camelCaseRest];
}

/** @type {import('vovk').VovkConfig} */
const config = {
  imports: {
    validateOnClient: "vovk-ajv",
    createRPC: "vovk-react-query",
  },
  moduleTemplates: {
    controller: "vovk-zod/module-templates/Controller.ts.ejs",
    service: "vovk-cli/module-templates/Service.ts.ejs",
  },
  extendClientWithOpenAPI: {
    rootModules: [{
      source: {
        url: "https://data-api.coindesk.com/info/v1/openapi"
      },
      getMethodName: ({ operationObject }) => getOperationInfo(operationObject.operationId ?? "ERROR")[1],
      getModuleName: ({ operationObject }) => 'CoinDesk' + getOperationInfo(operationObject.operationId ?? "ERROR")[0] + "RPC",
    }]
  }
};

export default config;
