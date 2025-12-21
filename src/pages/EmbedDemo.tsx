import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';

const EmbedDemo = () => {
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedJS, setCopiedJS] = useState(false);
  const [copiedDistrictIframe, setCopiedDistrictIframe] = useState(false);
  const [copiedDistrictJS, setCopiedDistrictJS] = useState(false);

  // Use localhost for demo, or production URL if deployed
  const baseUrl = window.location.origin;
  const apiUrl = baseUrl.includes('localhost') ? 'http://localhost:3001' : baseUrl;
  const dataUrl = `${baseUrl}/nfhs5_protein_consumption_eggs.csv`;
  const districtDataUrl = 'https://saketkc.github.io/vayuayan-archive/daily_average_district/20251219_daily_AQI_mean.csv.gz';

  const iframeCode = `<iframe
  src="${apiUrl}/api/v1/embed?dataUrl=${encodeURIComponent(dataUrl)}&colorScale=viridis&title=Protein%20consumption%20in%20India"
  width="800"
  height="600"
  frameborder="0"
  sandbox="allow-scripts allow-same-origin"
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

  const districtIframeCode = `<iframe
  src="${apiUrl}/api/v1/embed?dataUrl=${encodeURIComponent(districtDataUrl)}&colorScale=spectral&title=AQI%20-%20Mean%20(2025-12-19)&hideDistrictNames=true&hideValues=true"
  width="800"
  height="800"
  frameborder="0"
  sandbox="allow-scripts allow-same-origin"
  style="border: none; max-width: 100%;">
</iframe>`;

  const districtJsCode = `<!-- Container for the map -->
<div id="bharatviz-district-map"></div>

<!-- Load BharatViz embed script -->
<script src="${apiUrl}/embed.js"></script>

<!-- Initialize the map -->
<script>
  BharatViz.embed({
    container: '#bharatviz-district-map',
    dataUrl: '${districtDataUrl}',
    colorScale: 'spectral',
    title: 'AQI - Mean (2025-12-19)',
    hideDistrictNames: true,
    hideValues: true
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
    const districtDataUrl = 'https://saketkc.github.io/vayuayan-archive/daily_average_district/20251219_daily_AQI_mean.csv.gz';

    const script = document.createElement('script');
    script.src = `${apiUrl}/embed.js`;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // Initialize the JavaScript widgets after script loads
      if (window.BharatViz) {
        // States widget
        window.BharatViz.embed({
          container: '#js-embed-demo',
          dataUrl: dataUrl,
          colorScale: 'viridis',
          title: 'Protein consumption in India'
        });

        // Districts widget
        window.BharatViz.embed({
          container: '#js-district-embed-demo',
          dataUrl: districtDataUrl,
          colorScale: 'spectral',
          title: 'AQI - Mean (2025-12-19)',
          hideDistrictNames: true,
          hideValues: true
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
                  height="800"
                  style={{ border: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
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

        {/* District-Level Maps */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">District-Level Maps</h2>
          <p className="text-gray-600 mb-8">
            BharatViz also supports district-level choropleth maps across India. Hover over districts to see their names and values.
          </p>

          {/* District iframe Method */}
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">iframe Embed (District-Level)</h3>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Example</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(districtIframeCode, setCopiedDistrictIframe)}
                >
                  {copiedDistrictIframe ? (
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
                District-level map showing AQI data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{districtIframeCode}</code>
              </pre>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Live Demo</CardTitle>
              <CardDescription>District-level map with hover tooltips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src={`${apiUrl}/api/v1/embed?dataUrl=${encodeURIComponent(districtDataUrl)}&colorScale=spectral&title=AQI%20-%20Mean%20(2025-12-19)&hideDistrictNames=true&hideValues=true`}
                  width="100%"
                  height="800"
                  style={{ border: 'none' }}
                  sandbox="allow-scripts allow-same-origin"
                  title="BharatViz district iframe embed demo"
                />
              </div>
            </CardContent>
          </Card>

          {/* District JavaScript Widget Method */}
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">JavaScript Widget (District-Level)</h3>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Code Example</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(districtJsCode, setCopiedDistrictJS)}
                >
                  {copiedDistrictJS ? (
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
                JavaScript widget for district-level maps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{districtJsCode}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Demo</CardTitle>
              <CardDescription>District-level JavaScript widget with hover tooltips</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4">
                <div id="js-district-embed-demo" className="min-h-[700px]">
                  <div className="text-center py-20 text-gray-500">
                    Loading district map...
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
