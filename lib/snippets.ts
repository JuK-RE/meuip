export type SnippetLang = { id: string; label: string };

export const snippetLangs: SnippetLang[] = [
  { id: "curl", label: "cURL" },
  { id: "js", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "go", label: "Go" },
  { id: "ruby", label: "Ruby" },
  { id: "csharp", label: "C#" },
  { id: "powershell", label: "PowerShell" },
];

/** Exemplo de chamada em cada linguagem. `stream` troca a leitura única pela leitura aos poucos (ping). */
export function snippet(lang: string, url: string, stream = false): string {
  switch (lang) {
    case "curl":
      return stream ? `curl -N "${url}"` : `curl "${url}"`;
    case "js":
      return stream
        ? `const res = await fetch("${url}");
const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();

for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  process.stdout.write(value);
}`
        : `const res = await fetch("${url}");
const data = await res.json();
console.log(data);`;
    case "python":
      return stream
        ? `import requests

with requests.get("${url}", stream=True) as res:
    for line in res.iter_lines(decode_unicode=True):
        print(line)`
        : `import requests

res = requests.get("${url}")
print(res.json())`;
    case "php":
      return stream
        ? `<?php
$stream = fopen("${url}", "r");
while (($line = fgets($stream)) !== false) {
    echo $line;
}
fclose($stream);`
        : `<?php
$data = json_decode(file_get_contents("${url}"), true);
print_r($data);`;
    case "go":
      return stream
        ? `package main

import (
	"bufio"
	"fmt"
	"net/http"
)

func main() {
	res, err := http.Get("${url}")
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	scanner := bufio.NewScanner(res.Body)
	for scanner.Scan() {
		fmt.Println(scanner.Text())
	}
}`
        : `package main

import (
	"fmt"
	"io"
	"net/http"
)

func main() {
	res, err := http.Get("${url}")
	if err != nil {
		panic(err)
	}
	defer res.Body.Close()

	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))
}`;
    case "ruby":
      return stream
        ? `require "net/http"

Net::HTTP.get_response(URI("${url}")) do |res|
  res.read_body { |chunk| print chunk }
end`
        : `require "net/http"
require "json"

res = Net::HTTP.get(URI("${url}"))
puts JSON.parse(res)`;
    case "csharp":
      return stream
        ? `using var client = new HttpClient();
using var stream = await client.GetStreamAsync("${url}");
using var reader = new StreamReader(stream);

string? line;
while ((line = await reader.ReadLineAsync()) != null)
{
    Console.WriteLine(line);
}`
        : `using var client = new HttpClient();
var json = await client.GetStringAsync("${url}");
Console.WriteLine(json);`;
    case "powershell":
      return stream ? `curl.exe -N "${url}"` : `Invoke-RestMethod "${url}"`;
    default:
      return "";
  }
}
