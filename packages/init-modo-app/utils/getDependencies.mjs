const SHARED_DEPENDENCIES = ['gitlab:cescoc/eslint-config-modo-base']
const REACT_DEPENDENCIES = ['gitlab:cescoc/eslint-config-modo-react']

/**
 * @param {import("../index.mjs").ProjectType} projectType
 * @returns {string[]}
 */
const getDependecies = (projectType) => {
  switch (projectType) {
    default:
    case 'js':
      return SHARED_DEPENDENCIES
    case 'react':
      return SHARED_DEPENDENCIES.concat(REACT_DEPENDENCIES)
  }
}

export default getDependecies
