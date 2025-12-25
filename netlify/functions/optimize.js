const articleOptimizer = require('../../articleOptimizer');

exports.handler = async (event) => {
  try {
    const body = event.queryStringParameters || {};
    const command = body.command || 'optimize';
    const articleId = body.articleId ? parseInt(body.articleId) : null;

    if (command === 'test') {
      await articleOptimizer.testServices();
    }

    if (command === 'optimize') {
      await articleOptimizer.optimize(articleId);
    }

    if (command === 'batch') {
      await articleOptimizer.optimizeMultiple();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Optimizer executed successfully'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
