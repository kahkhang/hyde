
/*!
 * Module dependencies.
 */

exports.index = function (req, res) {
  res.render('index', {
    title: 'Node Express Mongoose Boilerplate'
  });
};
exports.SMRT = function (req, res) {
  res.render('SMRT', {
    title: 'SMRT Sentiment Heatmap'
  });
};
exports.test = function (req, res) {
  res.render('test', {
    title: 'SMRT Sentiment Heatmap'
  });
};
