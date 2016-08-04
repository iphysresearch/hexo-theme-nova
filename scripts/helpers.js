'use strict';

var pathFn = require('path');
var _ = require('lodash');
var url = require('url');
var util = require('util');
var crypto = require('crypto');

function md5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
};

hexo.extend.helper.register('i18n', function(key) {
  return this.__(key);
});

hexo.extend.helper.register('head_title', function() {
  var p = this.page;
  var ret = '';
  var sub = this.page_title(p);
  
  ret = this.i18n('site.title');
  if (!ret) {
    ret = this.config.title
  }
  // home page
  if (this.is_home()) {
    return ret;
  }
  
  if (this.is_archive()) {
    return sub + '|' + ret;
  }
  
  if (p.layout == 'project') {
    if (!(p.gh && p.gh.type == "get_repos")) {
      var paths = this.page.path.split('/');
      // get repo
      if (p.gh) {
        ret = this.gh_opts().repo;
      }
      else {
        if (paths.length >= 2) {
          ret = paths[paths.length - 2];
        }
      }
      // get path, has bugs
      var f = paths[paths.length - 1];
      var tmp = this.i18n('project.' + f);
      if (tmp !== 'project.' + f) {
        sub = tmp;
      }
    }
    return sub + '|' + ret;
  }
  
  if (sub) {
    return sub;// + '|' + ret;
  }
  else {
    return ret;
  }
});

// load <head> js and css
hexo.extend.helper.register('head_jscss', function() {
  var jc = this.theme.js_css;
  var _self = this;
  var ret = '';
  _.each(jc, function(item) {
    if (_.endsWith(item.url, 'js')) {
      ret += _self.js(item.url);
    }
    else if (_.endsWith(item.url, 'css')) {
      ret += _self.css(item.url);
    }
    else {
      // do nothing
    }
    ret += '\n';
  });
  return ret;
});

// load <head> keywords
hexo.extend.helper.register('head_keywords', function() {
  var _self = this;
  var p = this.page;
  var ret = '';
  // for post
  // if (this.is_post())

  var kw = [];
  var cats = p.categories;
  var tags = p.tags;
  if (this.is_home()) {
    cats = this.site.categories;
    tags = this.site.tags;
  }
  
  if (cats) {
    cats.forEach(function(item) {
      kw.push(item.name);
    });
  }
  if (tags) {
    tags.forEach(function(item) {
      if (kw.indexOf(item.name) < 0) kw.push(item.name);
    });
  }

  if (p.title2) {
    kw.push(this.i18n(p.title2))
  }
  else if (p.title) {
    kw.push(p.title);
  }

  return kw.join(',');

  // for page
  // TODO
});

// load <head> description
hexo.extend.helper.register('head_description', function(page) {
  var p = page ? page : this.page;
  
  var ret = p.description
  if (!ret)  ret = this.page_excerpt();
  if (!ret)  ret = this.__('site.description');
  if (!ret) ret = this.config.description;
  if (ret) {
    ret = this.strip_html(ret);
  }
  return ret;
});

// header nav menu
hexo.extend.helper.register('header_menu', function(className) {
  var menu = this.theme.menu;
  var result = '';
  var _self = this;

  _.each(menu, function(m) {
    result += '<li><a href="' + _self.url_for_lang(m.url) + '" class="' + className + '">' + _self.__('menu.' + m.name)
        + '</a></li>';
  });

  return result;
});

// return page title.
hexo.extend.helper.register('page_title', function(page) {
  var p = page ? page : this.page;
  var ret = '';
  if (p.title2) {
    ret = this.i18n(p.title2);
  }
  else if (p.title) {
    ret = p.title;
  }
  
  if (!ret) {
    if (this.is_category()) {
      ret = get_category_title(this, p);
    }
    else if (this.is_tag()) {
      ret = get_tag_title(this, p);
    }
    else if (this.is_archive()) {
      ret = get_archive_title(this, p);
    }
    else if (this.is_home()) {
      ret = this.__('menu.home');
    }
  }
  
  return ret;
});

// insert page path nav bar.
hexo.extend.helper.register('page_path', function(post, options) {
  var o = options || {};
  var _class = o.hasOwnProperty('class') ? o.class : 'category-item';
  var icon = o.hasOwnProperty('icon') ? o.icon : 'glyphicon glyphicon-folder-close';
  var _self = this;
  var ret = '';
  if (this.is_post()) {
    ret += '<span class="' + icon + '" aria-hidden="true"></span>';
    ret += _self.__('page.path') + '';
    // ret += '<ol class="breadcrumb path">';
    ret += '<a class="' + _class + '" href="' + _self.url_for_lang('/') + '">' + this.__('page.blog') + '</a>';
    var cats = post.categories;
    if (cats == null || cats.length == 0) {
      // ret += '</ol>';
      return ret;
    }

    cats.forEach(function(item) {
      ret += '<a class="' + _class + '" href="' + _self.url_for_lang(item.path) + '">' + item.name + '</a>';
    });
    // ret += '</ol>';
  }
  /*
  else if (post.layout == 'project') {
    var m = this.theme.menu[1];
    ret += _self.__('page.path') + '';
    ret += '<ol class="breadcrumb path">';
    ret += '<li><a class="" href="' + _self.url_for_lang(m.url) + '">' + this.__('menu.' + m.name) + '</a></li>';
    var paths = this.page.path.split('/');
    // get repo
    var repo;
    if (this.page.gh) {
      repo = this.gh_opts().repo;
    }
    else {
      if (paths.length >= 2) {
        repo = paths[paths.length - 2];
      }
    }
    ret += '<li><a class="" href="' + _self.url_for_lang(m.url + '/' + repo) + '">' + repo + '</a></li>';
    // get path
    var f = paths[paths.length - 1];
    var tmp = this.__('project.' + f);
    if (tmp == 'project.' + f) {
      tmp = this.page.title2 ? this.__(this.page.title2) : this.page.title;
    }
    ret += '<li>' + tmp + '</li>';
    ret += '</ol>';
  }*/

  return ret;
});

// get page excerpt
hexo.extend.helper.register('page_excerpt', function(post) {
  var p = post ? post : this.page;
  var excerpt = p.excerpt;
  if (!excerpt && p.content) {
    var pos = p.content.indexOf('</p>');
    if (pos > 0) {
      excerpt = p.content.substring(0, pos + 4);
    }
  }
  return excerpt;
});

hexo.extend.helper.register('page_share_jiathis', function(post, webid) {
  var p = post ? post : this.page;
  var webid = webid ? webid : '';
  var link = encodeURI(p.permalink);
  var title = encodeURI(this.page_title(p));
  var uid = this.theme.share.jiathis.uid;
  var summary = encodeURI(this.strip_html(this.page_excerpt(p)));
  if (summary && summary.length > 140) {
    summary = summary.substring(0, 100);
  }

  var url = util.format('http://www.jiathis.com/send/?webid=%s&url=%s&title=%s&uid=%s&summary=%s', webid, link, title,
      uid, summary);
  return url;
});
// insert category of post
hexo.extend.helper.register('post_cates', function(post, options) {
  var o = options || {};
  var _class = o.hasOwnProperty('class') ? o.class : 'category-item';
  var icon = o.hasOwnProperty('icon') ? o.icon : 'glyphicon glyphicon-folder-close';
  var cats = post.categories;
  var _self = this;
  var ret = '';
  if (cats == null || cats.length == 0) {
    return ret;
  }
  ret += '<span class="post-category">';
  ret += '<i class="' + icon + '"></i><span class="hidden-xs">' + _self.__('category.label') + '</span>';
  cats.forEach(function(item, i) {
    ret += '<a class="' + _class + '" href="' + _self.url_for_lang(item.path) + '">' + item.name + '</a>';
  });
  ret += '</span>';
  return ret;
});

// insert tag of post
hexo.extend.helper.register('post_tags', function(post, options) {
  var o = options || {};
  var _class = o.hasOwnProperty('class') ? o.class : 'tag-item';
  var icon = o.hasOwnProperty('icon') ? o.icon : 'glyphicon glyphicon-tags';
  var cats = post.tags;
  var _self = this;
  var ret = '';
  if (cats == null || cats.length == 0) {
    return ret;
  }
  ret += '<span class="post-tag">';
  ret += '<i class="' + icon + '"></i><span class="hidden-xs">' + _self.__('tag.label') + '</span>';
  cats.forEach(function(item) {
    ret += '<a class="' + _class + '" href="' + _self.url_for_lang(item.path) + '">' + item.name + '</a>';
  });
  ret += '</span>';
  return ret;
});

// widget category
hexo.extend.helper.register('widget_cates', function(options) {
  var o = options || {}
  var show_count = o.hasOwnProperty('show_count') ? o.show_count : true;
  var cats = this.site.categories;
  var _self = this;
  var ret = '';
  if (cats == null || cats.length == 0) {
    return _self.__('category.empty');
  }
  ret += '<ul class="list-group">';
  cats.forEach(function(item) { // console.log(item)
    ret += '<li class="list-group-item"><a href="' + _self.url_for_lang(item.path) + '">' + item.name + '</a>';
    if (show_count) {
      ret += '<span class="badge">' + item.posts.length + '</span>';
    }
    ret += '</li>';
  });
  ret += '</ul>';
  return ret;
});

// widget tags
hexo.extend.helper.register('widget_tags', function() {
  var cats = this.site.tags;
  var _self = this;
  var ret = '';
  if (cats == null || cats.length == 0) {
    return _self.__('tag.empty');
  }
  ret += '<ul class="list-group">';
  cats.forEach(function(item) {
    ret += '<li class="list-group-item"><a href="' + _self.url_for_lang(item.path) + '">' + item.name + '</a></li>';
  });
  ret += '</ul>';
  return ret;
});
// widget tags data
hexo.extend.helper.register('widget_tags_data', function() {
  var cats = this.site.tags || [];
  var tags = [];
  var _self = this;
  cats.schema.virtual('path').get(function() {
    var tagDir = _self.config.tag_dir;
    if (tagDir[tagDir.length - 1] !== '/') tagDir += '/';

    return _self.url_for_lang(tagDir + this.slug + '/');
  });
  return cats;
});

// widget recent_post
hexo.extend.helper.register('widget_recents', function(posts, options) {
  return this.nova_list_posts(posts, options);
});

// page unique id, used for comments
// options: hash: false, combined: true;
hexo.extend.helper.register('page_uid', function(page, options) {
  var p = page ? page : this.page;
  var path = p.path;
  if (p === this.page) {
    if (this.is_home() || this.is_category() || this.is_tag() || this.is_archive()) {
      path = p.base;
    }
  }
  // path = this.url_for(path); // don't add / 

  var o = options || {};
  var hash = o.hasOwnProperty('hash') ? o.hash : this.theme.page_uid.hash;
  var combined = o.hasOwnProperty('combined') ? o.combined : this.theme.page_uid.combined;

  var paths = path.split('/');
  var lang = paths[0];
  var file = paths[paths.length - 1];
  if (combined && this.get_langs().indexOf(lang) >= 0) {
    paths.shift();
    var ret = paths.join('/');
//    if (!_.endsWith(path, '/')) {
//      ret += '/';
//    }
    return hash ? md5(ret) : ret;
  }
  return hash ? md5(path) : path;
});

// return page show toc or not
hexo.extend.helper.register('page_toc', function(options) {
  var p = this.page;
  if (p.layout == 'post') {// p.toc default off;
    return this.is_post() && this.theme.toc.post && p.toc;
  }
  else if (p.layout == 'page') {
    if (!this.theme.toc.page) {
      return false;
    }
    if (typeof (p.toc) == 'undefined') {
      return true;
    }
    return p.toc;
  }
  else if (p.layout == 'project') {
    if (!this.theme.toc.project) {
      return false;
    }
    if (typeof (p.toc) == 'undefined') {
      return true;
    }
    return p.toc;
  }
});

hexo.extend.helper.register('canonical_url', function(lang) {
  var path = this.page.canonical_path;
  if (lang && lang !== this.default_lang()) path = lang + '/' + path;

  return this.config.url + '/' + path;
});

hexo.extend.helper.register('lang_name', function(lang) {
  var data = this.site.data.languages[lang];
  return data.name || data;
});

// internal method
var archive_connector = '－';
function get_category_title(hexo, page) {
  var dirs = page.base.split('/');
  var ret = hexo.__('category.name');
  for(var i=1;i<dirs.length; i++){
    var dir = dirs[i];
    if (dir.length == 0) continue;
    var map = hexo.config.category_map;
    if (map) {
      for(var key in map) {
        if (map[key] === dir) {
          dir = key;
          break;
        }
      }
    }
    ret += archive_connector + dir;
  }
  return ret;
};

function get_tag_title(hexo, page) {
  var dirs = page.base.split('/');
  var ret = hexo.__('tag.name');
  for(var i=1;i<dirs.length; i++){
    var dir = dirs[i];
    if (dir.length == 0) continue;
    var map = hexo.config.tag_map;
    if (map) {
      for(var key in map) {
        if (map[key] === dir) {
          dir = key;
          break;
        }
      }
    }
    ret += archive_connector + dir;
  }
  return ret;
};

function get_archive_title(hexo, page) {
  var dirs = page.base.split('/');
  var ret = hexo.__('archive.name');
  for(var i=1;i<dirs.length; i++){
    var dir = dirs[i];
    if (dir.length == 0) continue;
    ret += archive_connector + dir;
  }
  return ret;
};
