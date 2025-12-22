import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';

const EmbedDemo = () => {
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedJS, setCopiedJS] = useState(false);
  const [copiedDistrictIframe, setCopiedDistrictIframe] = useState(false);
  const [copiedDistrictJS, setCopiedDistrictJS] = useState(false);

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
      if (window.BharatViz) {
        window.BharatViz.embed({
          container: '#js-embed-demo',
          dataUrl: dataUrl,
          colorScale: 'viridis',
          title: 'Protein consumption in India'
        });

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
      <Helmet>
        <title>Embed Interactive India Maps on Your Website | BharatViz</title>
        <meta name="title" content="Embed Interactive India Maps on Your Website | BharatViz" />
        <meta name="description" content="Easily embed beautiful, interactive choropleth maps of India on your website. State-level and district-level data visualization with simple iframe or JavaScript integration. Free to use." />
        <meta name="keywords" content="embed India maps, interactive maps, choropleth embed, India data visualization, map widget, iframe maps, district maps embed, state maps widget, REST API maps, data journalism India" />

        <link rel="canonical" href="https://bharatviz.saketlab.in/embed-demo" />

        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://bharatviz.saketlab.in/embed-demo" />
        <meta property="og:title" content="Embed Interactive India Maps on Your Website | BharatViz" />
        <meta property="og:description" content="Easily embed beautiful, interactive choropleth maps of India on your website. State-level and district-level data visualization with simple iframe or JavaScript integration. Free to use." />
        <meta property="og:image" content="https://bharatviz.saketlab.in/bharatviz_favicon.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="BharatViz - Interactive India Maps Embed Demo" />
        <meta property="og:site_name" content="BharatViz" />
        <meta property="og:locale" content="en_US" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://bharatviz.saketlab.in/embed-demo" />
        <meta name="twitter:title" content="Embed Interactive India Maps on Your Website | BharatViz" />
        <meta name="twitter:description" content="Easily embed beautiful, interactive choropleth maps of India. State-level and district-level data visualization with simple iframe or JavaScript integration." />
        <meta name="twitter:image" content="https://bharatviz.saketlab.in/bharatviz_favicon.png" />
        <meta name="twitter:image:alt" content="BharatViz - Interactive India Maps" />
        <meta name="twitter:site" content="@saketkc" />
        <meta name="twitter:creator" content="@saketkc" />

        <meta name="author" content="Saket Choudhary" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            "name": "How to Embed Interactive India Maps",
            "description": "Learn how to embed beautiful, interactive choropleth maps of India on your website using BharatViz",
            "image": "https://bharatviz.saketlab.in/bharatviz_favicon.png",
            "step": [
              {
                "@type": "HowToStep",
                "name": "Choose your method",
                "text": "Select between iframe embed or JavaScript widget integration"
              },
              {
                "@type": "HowToStep",
                "name": "Copy the code",
                "text": "Copy the provided embed code for your chosen method"
              },
              {
                "@type": "HowToStep",
                "name": "Paste on your website",
                "text": "Add the code to your HTML where you want the map to appear"
              }
            ],
            "tool": {
              "@type": "HowToTool",
              "name": "BharatViz"
            }
          })}
        </script>
      </Helmet>

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

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">District-Level Maps</h2>
          <p className="text-gray-600 mb-8">
            BharatViz also supports district-level choropleth maps across India. Hover over districts to see their names and values.
          </p>

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
