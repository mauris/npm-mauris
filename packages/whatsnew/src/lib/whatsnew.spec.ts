import {
  findPartitionSatisfies,
  semverMajorPartition,
  whatsnew,
} from './whatsnew';

describe('whatsnew', () => {
  it('should work', () => {
    expect(whatsnew).toBeInstanceOf(Function);
  });
});

function setupFunctionUnderTest<TParams extends unknown[], TReturn>(
  funcUnderTest: (...params: TParams) => TReturn
) {
  return async (params: TParams, expected: TReturn) => {
    const result = await funcUnderTest(...params);
    expect(result).toStrictEqual(expected);
  };
}

describe('semverMajorPartition', () => {
  const runTest = setupFunctionUnderTest(semverMajorPartition);
  it('should run correctly for prerelease', () => {
    runTest(
      [['0.0.1', '0.0.2', '0.1.0', '0.1.1', '1.0.0-alpha', '1.0.0']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.1.1',
          range: '>=0.0.1 <=0.1.1',
          versions: ['0.0.1', '0.0.2', '0.1.0', '0.1.1'],
          next: {
            major: 1,
            start: '1.0.0-alpha',
            end: '1.0.0',
            range: '>=1.0.0-alpha <=1.0.0',
            versions: ['1.0.0-alpha', '1.0.0'],
            next: null,
          },
        },
        {
          major: 1,
          start: '1.0.0-alpha',
          end: '1.0.0',
          range: '>=1.0.0-alpha <=1.0.0',
          versions: ['1.0.0-alpha', '1.0.0'],
          next: null,
        },
      ]
    );
  });

  it('should return correct values', () => {
    runTest(
      [['0.0.1']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.0.1',
          range: '>=0.0.1 <=0.0.1',
          versions: ['0.0.1'],
          next: null,
        },
      ]
    );
    runTest(
      [['0.0.1', '0.0.2']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.0.2',
          range: '>=0.0.1 <=0.0.2',
          versions: ['0.0.1', '0.0.2'],
          next: null,
        },
      ]
    );
    runTest(
      [['0.0.1', '0.0.2', '0.1.0']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.1.0',
          range: '>=0.0.1 <=0.1.0',
          versions: ['0.0.1', '0.0.2', '0.1.0'],
          next: null,
        },
      ]
    );
    runTest(
      [['0.0.1', '0.0.2', '0.1.0', '0.1.1']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.1.1',
          range: '>=0.0.1 <=0.1.1',
          versions: ['0.0.1', '0.0.2', '0.1.0', '0.1.1'],
          next: null,
        },
      ]
    );
    runTest(
      [['0.0.1', '0.0.2', '0.1.0', '0.1.1', '1.0.0']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.1.1',
          range: '>=0.0.1 <=0.1.1',
          versions: ['0.0.1', '0.0.2', '0.1.0', '0.1.1'],
          next: {
            major: 1,
            start: '1.0.0',
            end: '1.0.0',
            range: '>=1.0.0 <=1.0.0',
            versions: ['1.0.0'],
            next: null,
          },
        },
        {
          major: 1,
          start: '1.0.0',
          end: '1.0.0',
          range: '>=1.0.0 <=1.0.0',
          versions: ['1.0.0'],
          next: null,
        },
      ]
    );
    runTest(
      [['0.0.1', '0.0.2', '0.1.0', '0.1.1', '1.0.0', '1.0.2']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.1.1',
          range: '>=0.0.1 <=0.1.1',
          versions: ['0.0.1', '0.0.2', '0.1.0', '0.1.1'],
          next: {
            major: 1,
            start: '1.0.0',
            end: '1.0.2',
            range: '>=1.0.0 <=1.0.2',
            versions: ['1.0.0', '1.0.2'],
            next: null,
          },
        },
        {
          major: 1,
          start: '1.0.0',
          end: '1.0.2',
          range: '>=1.0.0 <=1.0.2',
          versions: ['1.0.0', '1.0.2'],
          next: null,
        },
      ]
    );
    runTest(
      [['0.0.1', '0.0.2', '0.1.0', '0.1.1', '1.0.0', '1.0.2', '5.0.0']],
      [
        {
          major: 0,
          start: '0.0.1',
          end: '0.1.1',
          range: '>=0.0.1 <=0.1.1',
          versions: ['0.0.1', '0.0.2', '0.1.0', '0.1.1'],
          next: {
            major: 1,
            start: '1.0.0',
            end: '1.0.2',
            range: '>=1.0.0 <=1.0.2',
            versions: ['1.0.0', '1.0.2'],
            next: null,
          },
        },
        {
          major: 1,
          start: '1.0.0',
          end: '1.0.2',
          range: '>=1.0.0 <=1.0.2',
          versions: ['1.0.0', '1.0.2'],
          next: null,
        },
        {
          major: 5,
          start: '5.0.0',
          end: '5.0.0',
          range: '>=5.0.0 <=5.0.0',
          versions: ['5.0.0'],
          next: null,
        },
      ]
    );
  });
});

describe('findPartitionSatisfies', () => {
  it('should return correct result', () => {
    const runTest = setupFunctionUnderTest(findPartitionSatisfies);

    runTest([[], '0.0.1'], null);
    runTest(
      [
        [
          {
            major: 0,
            start: '0.0.1',
            end: '0.0.1',
            range: '>=0.0.1 <=0.0.1',
            versions: ['0.0.1'],
            next: null,
          },
        ],
        '0.0.1',
      ],
      {
        major: 0,
        start: '0.0.1',
        end: '0.0.1',
        range: '>=0.0.1 <=0.0.1',
        versions: ['0.0.1'],
        next: null,
      }
    );
    runTest(
      [
        [
          {
            major: 0,
            start: '0.0.1',
            end: '0.0.1',
            range: '>=0.0.1 <=0.0.1',
            versions: ['0.0.1'],
            next: null,
          },
        ],
        '0.0.2',
      ],
      null
    );
    runTest(
      [
        [
          {
            major: 0,
            start: '0.0.1',
            end: '0.0.1',
            range: '>=0.0.1 <=0.0.1',
            versions: ['0.0.1'],
            next: null,
          },
          {
            major: 1,
            start: '1.0.0',
            end: '1.0.1',
            range: '>=1.0.0 <=1.0.1',
            versions: ['1.0.0', '1.0.1'],
            next: null,
          },
        ],
        '1.0.0',
      ],
      {
        major: 1,
        start: '1.0.0',
        end: '1.0.1',
        range: '>=1.0.0 <=1.0.1',
        versions: ['1.0.0', '1.0.1'],
        next: null,
      }
    );
  });
});
