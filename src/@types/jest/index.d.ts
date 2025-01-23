import { CustomMatcher } from 'jest' 

interface CustomMatchers<R = unknown> {
  toMatchJSON(expected?: string | object): R;
}

declare global {
  namespace jest {
    interface Expect extends CustomMatchers {}
    interface Matchers<R> extends CustomMatchers<R> {}
    interface InverseAsymmetricMatchers extends CustomMatchers {}
  }
}