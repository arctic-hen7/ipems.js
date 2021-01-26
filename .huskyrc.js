/**
 * Sets up Git hooks so we can run tasks before common Git actions.
 */

const DOCKER_COMPOSE_SERVICE_NAME = "playground";

const tasks = arr => arr.join("&&");
/**
 * Makes a command run regardless of whether we're in Docker or outside it.
 * The generated command checks if it's being run in Docker using either a custom-provided environment variable or
 * `RUNNING_IN_DOCKER` (you should set this to `true` in your Dockerfile). Then, it will accordingly run either the `docker` command
 * or the `notDocker` command. If not provided, `notDocker` defaults to running the `docker` command inside the specified Compose
 * `serviceName` with `docker-compose run --entrypoint`.
 * Most of the time, you'll just need to specify `docker`.
 * @param options
 * @param options.docker the command to run in the Docker environment
 * @param options.notDocker the command to run outside the Docker environment
 * @param options.serviceName the Docker Compose service name to run `docker` in if `notDocker` is `undefined`
 * @param options.customEnvVar a custom environment variable to use to check if the command is being run in Docker
 */
const createAgnosticCommand = ({
	docker,
	serviceName = DOCKER_COMPOSE_SERVICE_NAME,
	notDocker = `docker-compose run --entrypoint "${docker}" ${serviceName}`,
	customEnvVar = "RUNNING_IN_DOCKER",
}) =>
	`bash -c 'if [[ $${customEnvVar} == "true" ]]; then ${docker}; else ${notDocker}; fi'`;

module.exports = {
	hooks: {
		// Lint your commit messages
		"commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
		// Validate your code before you commit
		"pre-commit": tasks([
			createAgnosticCommand({ docker: "yarn run validate:nosummary" }),
		]),
	},
};
