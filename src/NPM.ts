import * as Bluebird from 'bluebird';
import * as winston from 'winston';
import { IPackage, IProject } from './types';

export class NPM {
  exec: any;
  logger: winston.Winston;

  constructor (exec, logger: winston.Winston) {
    this.exec = Bluebird.promisify(exec);
    this.logger = logger;
  }

  /**
   * Return the project catalog, which is an array of objects that
   * have `id`, `repositoryUrl` and `commitIsh` properties.
   *
   * @param {String}  username
   * @param {Array}   keywords Filter the projects by keywords
   * @return {Array}
   */
  async getCatalog (username: string, keywords: string[] = []): Promise<IProject[]> {
    let packages: string[] = [];

    try {
      // Find all the packages that the username has access to
      const listing: string = await this.exec(`npm access ls-packages ${username}`);
      packages = Object.keys(JSON.parse(listing));
    } catch (err) {
      throw new Error(`${username} does not have access to any NPM packages.`);
    }

    // The fields that we care about is rather short =)
    const fields = 'name repository.url keywords gitHead';

    // Fetch the package information concurrently from npm.
    this.logger.profile(`${packages.length} packages found`);
    const catalog: any[] = await Bluebird.map(packages, async (pkg) => {
      this.logger.debug(`Getting information about ${pkg}`);
      let info;

      try {
        // Bit of an anti-pattern, but need to ensure the package was ok and not
        // fail all remaining promises.
        info = await this.exec(`npm info --json ${pkg} ${fields}`);
      } catch (err) {
        this.logger.warn(`Failed to get info for ${pkg}: ${err.message}`);
        info = false;
      }

      return info;
    }, { concurrency: 10 });
    this.logger.profile(`${packages.length} packages found`);

    // Filter out anything that doesn't have a repo URL
    let packageCatalog: IPackage[] = catalog
      .filter(Boolean)
      .map((entry) => JSON.parse(entry))
      .filter((entry) => this.isValid(entry));

    // Filter based on any keywords
    if (keywords.length) {
      this.logger.info(`Filtering packages using keywords: ${keywords.join(' ')}`);

      packageCatalog = packageCatalog.filter(
        (entry) => entry.keywords && entry.keywords.some(
          (keyword) => keywords.indexOf(keyword) !== -1,
        ),
      );
    }

    // Return the definitions
    return packageCatalog.map(this.getDefinition);
  }

  /**
   * Determines if the entry is valid and can be used to build a catalog definition.
   */
  isValid (entry: IProject): boolean {
    if (typeof entry === 'string') {
      this.logger.warn(`Skipping ${entry}, no repository url found.`);
      return false;
    }

    if (entry.hasOwnProperty('repository.url') === false || !entry['repository.url']) {
      this.logger.warn(`Skipping ${entry.name}, no repository url found.`);
      return false;
    }

    return true;
  }

  /**
   * Given the result from NPM, return the definition.
   */
  getDefinition (entry: IPackage): IProject {
    // Normalise the repository URL for the purposes of `scavenger fetch`.
    const repositoryUrl = entry['repository.url'].replace(
      /^(git:\/\/|git@)(.*)[:]/,
      'https://$2/',
    );

    // Replace any package @scope with nothing.
    const name = entry.name.replace(/^(@.*)[/]/, '');

    return {
      id: entry.name,
      name,
      repositoryUrl,
      commitIsh: entry.gitHead || 'master',
    };
  }
}
