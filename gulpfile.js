
let project_folder = "dist" //результат работы. Всё сюда
let source_folder = "#src" //исходники

let path = {
    build: { // ВЫВОД указывает путь к отдельным файлам в папке dist
        html: project_folder+"/",
        css: project_folder+"/css/",
        js: project_folder+"/js/",
        img: project_folder+"/img/",
        fonts: project_folder+"/fonts/",
        others: project_folder+"/",
    },
    src: { // указывает исходный путь к отдельным файлам
        html: [source_folder+"/*.html", "!" + source_folder+"/_*.html"],
        css: source_folder+"/scss/style.scss",
        js: source_folder+"/js/script.js",
        img: source_folder+"/img/**/*.{jpg,png,svg,gif,ico,webp}",
        fonts: source_folder+"/fonts/*.ttf",
        others: source_folder+"/*.md",
    },
    watch: {
        html: source_folder+"/**/*.html",
        css: source_folder+"/scss/**/*.scss",
        js: source_folder+"/js/**/*.js",
        img: source_folder+"/img/**/*.{jpg,png,svg,gif,ico,webp}",
        others: source_folder+"/*.md",
    },
    clean: "./" + project_folder + "/"
}

let {src,dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require("browser-sync").create(), //Обновляет браузер
    fileinclude = require("gulp-file-include"), //Соеденяет файлы
    del = require("del") //Удаляет папку dist шоб версия могла обновиться
    scss = require('gulp-sass')(require ('sass')) //SCSS благодаря этой штуку scss => css
    autoprefixer = require('gulp-autoprefixer') //Выставляет префиксы
    group_media = require('gulp-group-css-media-queries') //Объеденияет media запросы
    clean_css = require('gulp-clean-css') //Сжимает css. Оптимизация кода
    rename = require('gulp-rename') //Переимиеновываю файлы, чтобы сохранять две версии файлов
    uglify = require('gulp-uglify-es').default //Сжимает js. Оптимизация кода
    imagemin = require('gulp-imagemin') //Сжимает фотографии
    webp = require('gulp-webp') //Переводит в формат webp
    webphtml = require('gulp-webp-html') //В html можно просто вставить картинку, а он добавит её webp
    webpcss = require('gulp-webpcss') //В html можно просто вставить картинку, а он добавит её webp
    svgprite = require('gulp-svg-sprite') // Чё это я не разобрался.
    ttf2woff = require('gulp-ttf2woff') //превращает ttf в woff
    ttf2woff2 = require('gulp-ttf2woff2') //превращает ttf в woff2
    fonter = require('gulp-fonter')

function browserSync() {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/"
        },
        port: 3000,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(
            scss({
                outputStyle: "expanded"
            })
        )
        .pipe(
            group_media()
        )
        .pipe(
            autoprefixer({
                overrideBrowserslist: ["last 5 versions"],
                cascade: true //стиль написания какой-то
            })
        )
        .pipe(webpcss({
            webpClass: '.webp',
            noWebpClass: '.no-webp'
        }))
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(
            rename({
                extname: ".min.css"
            })
        )
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(
            imagemin({
                progressive: true,
                svgPlugins: [{ removeViewBox: false }],
                interlaced: true,
                optimizationLevel: 3 // 0 to 7
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

gulp.task('otf2ttf', function () {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'))
})

gulp.task('svgSprite', function () {
    return gulp.src([source_folder + '/iconspite/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../icons/icons.svg"
                }
            }
        }))
        .pipe(dest(path.build.img))
})

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

function others() {
    src(path.src.others)
        .pipe(dest(path.build.others))
}

function watchFiles() {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], images)
    gulp.watch([path.watch.others], others)
}

function clean() {
    return del(path.clean)
}

let build = gulp.series(clean, gulp.parallel(js,css,html,images,fonts,others))
let watch = gulp.parallel(build,watchFiles,browserSync)

exports.others = others
exports.fonts = fonts
exports.images = images
exports.js = js
exports.css = css
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch