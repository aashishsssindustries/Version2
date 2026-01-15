import zipfile
import xml.etree.ElementTree as ET
import os

ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def extract_text(input_path, output_path):
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return

    try:
        with zipfile.ZipFile(input_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            text_parts = []
            for node in tree.iter():
                if node.tag == f"{{{ns['w']}}}t":
                    if node.text:
                        text_parts.append(node.text)
                elif node.tag == f"{{{ns['w']}}}p":
                    text_parts.append('\n')
                elif node.tag == f"{{{ns['w']}}}br":
                     text_parts.append('\n')

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write("".join(text_parts))
            print(f"Successfully extracted to {output_path}")
    except Exception as e:
        print(f"Error reading {input_path}: {e}")

if __name__ == "__main__":
    extract_text("WealthMax_SRS_v1.20.docx", "srs_utf8.txt")
    extract_text("Implementation Outline.docx", "outline_utf8.txt")
