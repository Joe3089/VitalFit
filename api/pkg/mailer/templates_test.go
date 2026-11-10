package mailer

import (
	"bytes"
	"html/template"
	"io/fs"
	"strings"
	"testing"
)

// TestTemplatesAreWellFormed parses every email template with html/template,
// which rejects markup that ends inside a <style> or <script> block (a
// missing closing tag hides the whole email body in mail clients).
func TestTemplatesAreWellFormed(t *testing.T) {
	entries, err := fs.ReadDir(FS, "templates")
	if err != nil {
		t.Fatal(err)
	}
	for _, e := range entries {
		raw, err := fs.ReadFile(FS, "templates/"+e.Name())
		if err != nil {
			t.Fatal(err)
		}
		body := string(raw)
		if strings.Count(body, "<style") != strings.Count(body, "</style>") {
			t.Errorf("%s: unbalanced <style> tags", e.Name())
		}
		tmpl, err := template.New(e.Name()).Option("missingkey=zero").Parse(body)
		if err != nil {
			t.Errorf("%s: %v", e.Name(), err)
			continue
		}
		if tmpl.Lookup("body") == nil {
			continue
		}
		var out bytes.Buffer
		if err := tmpl.ExecuteTemplate(&out, "body", map[string]any{}); err != nil && strings.Contains(err.Error(), "non-text context") {
			t.Errorf("%s: %v", e.Name(), err)
		}
	}
}
