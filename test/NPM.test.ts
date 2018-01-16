import * as sinon from 'sinon';
import * as winston from 'winston';
import { NPM as NpmScent } from '../src/NPM';

winston.level = 'error'; // Disable all debug info

describe('NPM Scent', () => {
  const username = 'temando:developers';
  const fields = 'name repository.url keywords gitHead';
  const execMock = sinon.stub();

  execMock.withArgs(`npm info --json @temando/api ${fields}`).yields(
    null,
    `
      {
        "name": "@temando/api",
        "repository.url": "git@src.temando.io:developer-experience/temando-node.git",
        "keywords": [ "library" ],
        "gitHead": "885e79b8b5264e485375e9d2fbb45b07fbb7bd3d"
      }
    `,
  );
  execMock.withArgs(`npm info --json react-lincoln ${fields}`).yields(
    null,
    `
      {
        "name": "react-lincoln",
        "repository.url": "https://github.com/temando/open-api-renderer.git",
        "keywords": [ "OpenAPI", "swagger" ]
      }
    `,
  );

  it('return the correct list', async () => {
    execMock.withArgs(`npm access ls-packages ${username}`).yields(
      null,
      `
        {
          "@temando/api": "read-write"
        }
      `,
    );

    const npm = new NpmScent(execMock, winston);
    const catalog = await npm.getCatalog(username);

    expect(catalog).toBeInstanceOf(Array);
    expect(catalog).toHaveLength(1);
    expect(catalog[0].id).toEqual('@temando/api');
    expect(catalog[0].name).toEqual('@temando/api');
    expect(catalog[0].repositoryUrl).toEqual('https://src.temando.io/developer-experience/temando-node.git');
    expect(catalog[0].commitIsh).toEqual('885e79b8b5264e485375e9d2fbb45b07fbb7bd3d');
  });

  it('returns the correct list using keywords', async () => {
    execMock.withArgs(`npm access ls-packages ${username}`).yields(
      null,
      `
        {
          "@temando/api": "read-write",
          "react-lincoln": "read-write"
        }
      `,
    );

    const npm = new NpmScent(execMock, winston);
    const catalog = await npm.getCatalog(username, ['OpenAPI']);

    expect(catalog).toBeInstanceOf(Array);
    expect(catalog).toHaveLength(1);
    expect(catalog[0].id).toEqual('react-lincoln');
    expect(catalog[0].name).toEqual('react-lincoln');
    expect(catalog[0].repositoryUrl).toEqual('https://github.com/temando/open-api-renderer.git');
    expect(catalog[0].commitIsh).toEqual('master');
  });

  it('ignore invalid items', async () => {
    execMock.withArgs(`npm access ls-packages ${username}`).yields(
      null,
      `
        {
          "@temando/api": "read-write",
          "react-lincoln": "read-write",
          "fake-package": "read-write"
        }
      `,
    );

    execMock.withArgs(`npm info --json fake-package ${fields}`).yields(
      null,
      `
        {
          "name": "fake-package",
          "keywords": [
            "fake"
          ]
        }
      `,
    );

    const npm = new NpmScent(execMock, winston);
    const catalog = await npm.getCatalog(username);

    expect(catalog).toBeInstanceOf(Array);
    expect(catalog).toHaveLength(2);
    expect(catalog[0].id).toEqual('@temando/api');
    expect(catalog[1].id).toEqual('react-lincoln');
  });

  it('ignores npm errors when retrieving items', async () => {
    execMock.withArgs(`npm access ls-packages ${username}`).yields(
      null,
      `
        {
          "@temando/api": "read-write"
        }
      `,
    );
    execMock.withArgs(`npm info --json @temando/api ${fields}`).yields(
      new Error('package does not exist')
    );

    const npm = new NpmScent(execMock, winston);
    const catalog = await npm.getCatalog(username);

    expect(catalog).toBeInstanceOf(Array);
    expect(catalog).toHaveLength(0);
  });

  it('throw error if npm user fails authentication', async () => {
    execMock.withArgs(`npm access ls-packages ${username}`).yields(
      Error('failed authentication'),
    );

    const npm = new NpmScent(execMock, winston);

    try {
      await npm.getCatalog(username);
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });
});
