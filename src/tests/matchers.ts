import { validate as isUUID } from 'uuid'

expect.extend({
  toMatchJSON(actual: any, expected: string | object) {
    const expectedObj =
      typeof expected === 'string' ? JSON.parse(expected) : expected

    const compareObjects = (actualData: any, expectedData: any): boolean => {
      if (typeof actualData !== typeof expectedData) return false

      if (Array.isArray(expectedData)) {
        if (actualData.length !== expectedData.length) return false
        return expectedData.every((item, index) =>
          compareObjects(actualData[index], item)
        )
      } else if (expectedData && typeof expectedData === 'object') {
        for (const key of Object.keys(expectedData)) {
          if (expectedData[key] === '{{uuid}}') {
            if (!isUUID(actualData[key])) return false
          } else if (expectedData[key] === '{{date}}') {
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(actualData[key])) return false
          } else if (!compareObjects(actualData[key], expectedData[key])) {
            return false
          }
        }
        return true
      } else {
        return actualData === expectedData
      }
    }

    const pass = compareObjects(actual, expectedObj)

    return {
      pass,
      message: () =>
        pass
          ? `Expected not to match JSON, but they matched.`
          : `Expected JSON to match, but it did not.\n\nExpected:\n${JSON.stringify(
              expectedObj,
              null,
              2
            )}\n\nReceived:\n${JSON.stringify(actual, null, 2)}`,
    }
  },
})
