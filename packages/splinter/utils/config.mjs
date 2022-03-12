/**
 * @typedef ToolMeta
 * @prop {string} name The name of the tool
 * @prop {string} packageProp The field used in the package.json used to config the tool.
 * @prop {string[]} possibleConfigs Possible config files/options supported by the tool
 * @prop {string} configFileName The filename used in our own templates.
 */

/** @type ToolMeta[] */
const toolsMeta = [
  {
    name: 'eslint',
    packageProp: 'eslintConfig',
    possibleConfigs: [
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.yaml',
      '.eslintrc.yml',
      '.eslintrc.json',
      'package.json',
    ],
    configFileName: '.eslintrc.json',
  },
  {
    name: 'prettier',
    packageProp: 'prettier',
    possibleConfigs: [
      'package.json',
      '.prettierrc',
      '.prettierrc.json',
      '.prettierrc.yml',
      '.prettierrc.yaml',
      '.prettierrc.json5',
      '.prettierrc.js',
      '.prettierrc.cjs',
      'prettier.config.js',
      'prettier.config.cjs',
      '.prettierrc.toml',
    ],
    configFileName: '.prettierrc.json',
  },
]

export { toolsMeta }
