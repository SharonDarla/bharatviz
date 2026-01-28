import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Helmet>
        <title>404 - Page Not Found | BharatViz</title>
        <meta name="title" content="404 - Page Not Found | BharatViz" />
        <meta name="description" content="The page you're looking for doesn't exist. Return to BharatViz to create beautiful choropleth maps of India." />
        <meta name="robots" content="noindex, nofollow" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="404 - Page Not Found | BharatViz" />
        <meta property="og:description" content="The page you're looking for doesn't exist. Return to BharatViz to create beautiful choropleth maps of India." />
        <meta property="og:site_name" content="BharatViz" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="404 - Page Not Found | BharatViz" />
        <meta name="twitter:description" content="The page you're looking for doesn't exist." />
      </Helmet>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
