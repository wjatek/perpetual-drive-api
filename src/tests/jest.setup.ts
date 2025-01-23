import { execSync } from 'child_process'

module.exports = async () => {
  console.log('Running global setup script...')

  execSync('npm run seed')
}
