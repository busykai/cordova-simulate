// Copyright (c) Microsoft Corporation. All rights reserved.
// Based in part on code from Vogue (https://github.com/andrewdavey/vogue)

module.exports.start = function (sock) {
    var hop = Object.prototype.hasOwnProperty;
    var head = document.getElementsByTagName('head')[0];
    var serverUrl = window.location.protocol + '//' + window.location.host + '/';
    var stylesheets;
    var socket = sock;

    /**
     * Reload a stylesheet. We just add a new query parameter to the stylesheet's URL, which causes the browser to fetch it again and apply it.
     *
     * @param {String} sheetRelativePath The URL of the stylesheet to be reloaded.
     */
    function reloadStylesheet(sheetRelativePath) {
        if (!stylesheets[sheetRelativePath]) {
            return;
        }

        var newHref = sheetRelativePath + (sheetRelativePath.indexOf('?') >= 0 ? '&' : '?') + '_livereload=' + (new Date).getTime();

        // Check if the appropriate DOM Node is there.
        if (!stylesheets[sheetRelativePath].setAttribute) {
            // Create the link.
            var stylesheet = document.createElement('link');

            stylesheet.setAttribute('rel', 'stylesheet');
            stylesheet.setAttribute('href', newHref);
            head.appendChild(stylesheet);

            // Update the reference to the newly created link.
            stylesheets[sheetRelativePath] = stylesheet;
        } else {
            // Update the href to the new URL.
            stylesheets[sheetRelativePath].href = newHref;
        }
    }

    /**
     * Reload the page. Currently, only does a naive window.location.reload().
     */
    function reloadPage() {
        window.location.reload(true);
    }

    /**
     * Fetch all the local stylesheets from the page.
     *
     * @returns {Object} The list of local stylesheets keyed by their relative path.
     */
    function getLocalStylesheets() {
        /**
         * Checks if the specified link element is a stylesheet, and if it is local.
         *
         * @param {Object} link The link element to check.
         * @returns {Boolean}
         */
        function isLocalStylesheet(link) {
            if (link.getAttribute('rel') !== 'stylesheet') {
                return false;
            }

            return link.href.indexOf(serverUrl) === 0 || !link.href.match(/^https?:/);
        }

        /**
         * Checks if the specified link's media attribute is 'print'.
         *
         * @param {Object} link The link element to check.
         * @returns {Boolean}
         */
        function isPrintStylesheet(link) {
            return link.getAttribute('media') === 'print';
        }

        /**
         * Get the stylesheet's path relative to the web root.
         *
         * @param {String} fileFullPath The full path of the stylesheet to check.
         * @returns {String} The relative path.
         */
        function getRelativePath(fileFullPath) {
            if (fileFullPath.indexOf(serverUrl === 0)) {
                return fileFullPath.substr(serverUrl.length);
            }

            // The specified path doesn't seem to be under the web root, so return the full path itself (it could already be a relative path).
            return fileFullPath;
        }

        function getProperty(property) {
            return this[property];
        }

        var stylesheets = {};

        // Go through all the links in the page, looking for stylesheets.
        var links = document.getElementsByTagName('link');

        for (var i = 0; i < links.length; ++i) {
            if (isPrintStylesheet(links[i]) || !isLocalStylesheet(links[i])) {
                continue;
            }

            stylesheets[getRelativePath(links[i].href)] = links[i];
        }

        // Go through all the style tags, looking for @import tags.
        var reImport = /@import\s+url\(["']?([^"'\)]+)["']?\)/g;
        var styles = document.getElementsByTagName('style');

        for (var i = 0; i < styles.length; ++i) {
            if (isPrintStylesheet(styles[i])) {
                continue;
            }

            var content = styles[i].text || styles[i].textContent;
            var match = reImport.exec(content);

            while (match) {
                link = {
                    rel: 'stylesheet',
                    href: matches[1],
                    getAttribute: getProperty
                };

                if (isLocalStylesheet(link)) {
                    stylesheets[getRelativePath(link.href)] = link;
                }

                match = reImport.exec(content);
            }
        }

        return stylesheets;
    }

    stylesheets = getLocalStylesheets();
    socket.on('lr-update-css', function (message) {
        reloadStylesheet(message.href);
    });
    socket.on('lr-full-reload', function () {
        reloadPage();
    });
};