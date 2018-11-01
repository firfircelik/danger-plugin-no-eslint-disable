const PATTERN = /eslint-disable(-(line|next-line))?/
const GLOBAL_PATTERN = new RegExp(PATTERN.source, 'g')
const JS_FILE = /\.(js|ts)x?$/i

/**
 * prevent eslint disable
 */
export default async function noEslintDisable(options = {}) {
  const whitelist = options.whitelist || []
  if (!Array.isArray(whitelist))
    throw new Error(
      '[danger-plugin-no-eslint-disable] whitelist option has to be an array.',
    )

  const files = danger.git.modified_files
    .concat(danger.git.created_files)
    .filter(file => JS_FILE.test(file))
  const contents = await Promise.all(
    files.map(file =>
      danger.github.utils.fileContents(file).then(content => ({
        file,
        content,
      })),
    ),
  )

  contents.forEach(({ file, content }) => {
    let matches = content.match(GLOBAL_PATTERN)
    if (!matches) return
    matches = matches.filter(match => {
      const singleMatch = PATTERN.exec(match)
      return singleMatch && !whitelist.includes(singleMatch[0])
    })
    if (matches.length === 0) return

    fail(`${matches.length} eslint-disable(s) left in ${file}.`)
  })
}