import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';

const EmbedDemo = () => {
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedJS, setCopiedJS] = useState(false);

  // Use localhost for demo, or production URL if deployed
  const baseUrl = window.location.origin;
  const apiUrl = baseUrl.includes('localhost') ? 'http://localhost:3001' : baseUrl;
  const dataUrl = `${baseUrl}/nfhs5_protein_consumption_eggs.csv`;

  const iframeCode = `<iframe
  src="${apiUrl}/api/v1/embed?dataUrl=${encodeURIComponent(dataUrl)}&colorScale=viridis&title=Protein%20consumption%20in%20India"
  width="800"
  height="600"
  frameborder="0"
  style="border: none; max-width: 100%;">
</iframe>`;

  const jsCode = `<!-- Container for the map -->
<div id="bharatviz-map"></div>

<!-- Load BharatViz embed script -->
<script src="${apiUrl}/embed.js"></script>

<!-- Initialize the map -->
<script>
  BharatViz.embed({
    container: '#bharatviz-map',
    dataUrl: '${dataUrl}',
    colorScale: 'viridis',
    title: 'Protein consumption in India'
  });
</script>`;

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Load the BharatViz embed script
  useEffect(() => {
    const baseUrl = window.location.origin;
    const apiUrl = baseUrl.includes('localhost') ? 'http://localhost:3001' : baseUrl;
    const dataUrl = `${baseUrl}/nfhs5_protein_consumption_eggs.csv`;

    const script = document.createElement('script');
    script.src = `${apiUrl}/embed.js`;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize the JavaScript widget after script loads
      if (window.BharatViz) {
        window.BharatViz.embed({
          container: '#js-embed-demo',
          dataUrl: dataUrl,
          colorScale: 'viridis',
          title: 'Protein consumption in India'
        });
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <a href="/" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
            ← Back to BharatViz
          </a>
          <h1 className="text-4xl font-bold text-gray-900">Embed BharatViz Maps</h1>
          <p className="text-gray-600 mt-2 text-lg">
            Add live, interactive India maps to your website with just a few lines of code
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Introduction */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Two Ways to Embed</CardTitle>
            <CardDescription className="text-base">
              Choose between iframe (simple) or JavaScript widget (more control)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">iframe Method</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Simplest integration</li>
                  <li>✓ Works in any CMS</li>
                  <li>✓ No JavaScript required</li>
                  <li>✓ Isolated from your page</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">JavaScript Widget</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Better integration</li>
                  <li>✓ Responsive sizing</li>
                  <li>✓ Programmatic control</li>
                  <li>✓ Custom styling</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* iframe Method */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Method 1: iframe Embed</h2>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Example</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(iframeCode, setCopiedIframe)}
                >
                  {copiedIframe ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Copy and paste this HTML into your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{iframeCode}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Demo</CardTitle>
              <CardDescription>This is how the iframe embed looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={`${apiUrl}/api/v1/embed?dataUrl=${encodeURIComponent(dataUrl)}&colorScale=viridis&title=Protein%20consumption%20in%20India`}
                  width="100%"
                  height="600"
                  style={{ border: 'none' }}
                  title="BharatViz iframe embed demo"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* JavaScript Widget Method */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Method 2: JavaScript Widget</h2>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Example</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(jsCode, setCopiedJS)}
                >
                  {copiedJS ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>
              <CardDescription>
                Add this HTML to your page for a more integrated experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{jsCode}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Demo</CardTitle>
              <CardDescription>This is how the JavaScript widget looks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4">
                <div id="js-embed-demo" className="min-h-[500px]">
                  <div className="text-center py-20 text-gray-500">
                    Loading map...
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Configuration Options */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Configuration Options</h2>

          <Card>
            <CardHeader>
              <CardTitle>Available Parameters</CardTitle>
              <CardDescription>
                Customize your embedded maps with these options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Parameter</th>
                      <th className="text-left py-2 pr-4">Type</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">dataUrl</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">URL to your CSV data file (required)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">colorScale</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Color scheme: viridis, blues, greens, spectral, etc.</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">title</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Map title</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">legendTitle</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Custom legend title</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">invertColors</td>
                      <td className="py-2 pr-4">boolean</td>
                      <td className="py-2">Reverse the color scale</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">hideValues</td>
                      <td className="py-2 pr-4">boolean</td>
                      <td className="py-2">Hide numeric values on map</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">hideStateNames</td>
                      <td className="py-2 pr-4">boolean</td>
                      <td className="py-2">Hide state labels</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4 font-mono">hideDistrictNames</td>
                      <td className="py-2 pr-4">boolean</td>
                      <td className="py-2">Hide district labels</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-mono">width</td>
                      <td className="py-2 pr-4">string</td>
                      <td className="py-2">Width (iframe only, default: "100%")</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* API Documentation Link */}
        <section>
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Need More Control?</CardTitle>
              <CardDescription className="text-blue-900">
                Use the REST API for programmatic map generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                The REST API gives you full control over map generation with support for PNG, SVG, and PDF formats.
                This is useful for automated reports, scheduled jobs, and server-side rendering.
              </p>
              <Button asChild>
                <a href="https://bharatviz.saketlab.in/api" target="_blank" rel="noopener noreferrer">
                  View API Documentation
                </a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            BharatViz is open-source software licensed under MIT.{' '}
            <a
              href="https://github.com/saketlab/bharatviz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

// Extend window type for BharatViz
declare global {
  interface Window {
    BharatViz?: {
      embed: (options: {
        container: string;
        dataUrl: string;
        colorScale?: string;
        title?: string;
      }) => void;
    };
  }
}

export default EmbedDemo;
