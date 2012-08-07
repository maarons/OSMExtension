/*
 * Copyright (c) 2011, 2012 Marek Sapota
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

function Cache() {
  var cache = {};
  var size = 0;
  var maxSize = 100;

  function clean() {
    /* If there are too many items, remove half of them. */
    if (size > maxSize) {
      /* Array of all update times. */
      var times = [];
      $.each(cache, function(_, value) {
        times.push(value[1]);
      });
      times.sort();
      var minTime = times[maxSize / 2];
      size = 0;
      var newCache = {};
      $.each(cache, function(key, value) {
        if (value[1] > minTime) {
          ++size;
          newCache[key] = value;
        }
      });
      cache = newCache;
    }
  }

  this.push = function(key, value) {
    if (!cache[key]) {
      ++size;
    }
    cache[key] = [value, $.now()];
    clean();
  }

  this.get = function(key) {
    var value = cache[key];
    if (value) {
      /* Update last used time. */
      this.push(key, value[0]);
      return value[0];
    } else {
      return undefined;
    }
  }
}
