'use strict'

// Import dependencies
const gulp = require('gulp')
const sass = require('gulp-sass')
const del = require('del')
const hbs = require('handlebars')
const fs = require('fs-extra')
const yaml = require('js-yaml')
const sync = require('browser-sync').create()
const metalsmith = require('metalsmith')
const collections = require('metalsmith-collections')
const markdown = require('metalsmith-markdown')
const permalinks = require('metalsmith-permalinks')
const layouts = require('metalsmith-layouts')
const sitemap = require('metalsmith-mapsite')
const rss = require('metalsmith-feed')
const log = require('./lib/log')
const cname = require('./lib/cname')

// Import configuration file
const data = yaml.safeLoad(fs.readFileSync('./botan.yml', 'utf-8'))

// Register custom helpers for Handlebars
hbs.registerHelper('asset', path => {
  // Resolve path from root directory to asset
  let output = `../../assets/${path}`

  // Return resolved path
  return new hbs.SafeString(output)
})

// Build site pages and content
function content (done) {
  metalsmith(__dirname)
    .metadata(data) // Add site config to metadata
    .source(data.content.source) // Process files in this folder
    .destination(data.content.destination) // Output files in this folder
    .clean(false) // Don't clean the directory on every build
    .use(collections({ // Group related content for easy access later
      blog: 'blog/*.md',
      projects: 'projects/*.md'
    }))
    .use(markdown({ // Process Markdown files
      smartypants: true
    }))
    .use(permalinks({ // Add pretty permalinks
      relative: false
    }))
    .use(layouts({ // Wrap content with Handlebars templates
      engine: data.templates.engine,
      default: data.templates.default,
      directory: data.templates.directory,
      partials: data.templates.partials
    }))
    .use(sitemap(data.site.url)) // Generate a sitemap
    .use(rss({ // Generate RSS feeds for collections
      collection: 'blog'
    }))
    .build(error => {
      if (error) {
        log.error(`Whoops! Something broke: ${error}`)
      } else {
        log.success('Site pages and content compiled successfully')
      }
    })

  if (data.github.cname) {
    cname(data.site.url, data.content.destination)
  }

  done()
}

// Build site assets
function assets (done) {
  gulp.src(data.assets.sass.source)
    .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
    .pipe(gulp.dest(data.assets.sass.destination))

  log.success('Site assets compiled successfully')

  done()
}

// Clean production assets before building new ones
function clean () {
  return del(`${data.content.desintation}/**`)
}

// Live preview and hot-reload
function preview () {
  // Initialize BrowserSync
  sync.init({
    server: {
      baseDir: './docs'
    }
  })

  // Watch content and templates
  gulp.watch([`${data.content.source}/**/*`, `${data.templates.directory}/**/*`], content)

  // Watch assets
  gulp.watch(`${data.assets.sass.source}`, assets)

  // Reload live preview
  gulp.watch(`${data.content.destination}/**/*`).on('change', sync.reload)
}

// Define build process
let botan = gulp.series(clean, assets, content, preview)

// Bingo, bingo, you win the prize!
gulp.task('default', botan)
