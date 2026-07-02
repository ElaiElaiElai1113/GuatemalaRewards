import { copyFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const outDir = 'tmp-canva-transaction-pptx'
const assetDir = 'docs/transaction-guide-screenshots'

const slides = [
  {
    title: 'Business Transactions Training',
    subtitle: 'Process normal purchases and gift-card purchases from the Transactions page.',
    bullets: [
      'Dashboard is for business overview.',
      'Transactions is where staff scan QR codes and record sales.',
      'The system calculates customer total, points, and commission.',
    ],
    visual: 'business-login-live.png',
  },
  {
    title: 'Use Transactions, Not Dashboard',
    subtitle: 'The old QR Sales tab is now Dashboard, and transaction work moved to Transactions.',
    bullets: [
      'Open the Business Portal.',
      'Click Transactions in the business navigation.',
      'Use Dashboard only for metrics, signup QR, partners, and fulfillment review.',
    ],
    visual: 'transactions-overview.png',
  },
  {
    title: 'One Scanner Handles Two QR Types',
    subtitle: 'Staff do not need to choose the scanner type before scanning.',
    bullets: [
      'Scan the customer Member QR for normal sales.',
      'Scan the gift card QR when a customer is paying with a gift card.',
      'The form updates the correct field automatically.',
    ],
    visual: 'transactions-overview.png',
  },
  {
    title: 'Start Every Sale With The Customer',
    subtitle: 'Load the member first so points go to the correct account.',
    bullets: [
      'Scan the customer Member QR.',
      'Or paste the Member QR link or token.',
      'Click Load Member and confirm the customer name.',
    ],
    visual: 'transactions-overview.png',
  },
  {
    title: 'Enter The Base Bill',
    subtitle: 'Use the bill before tax and service charge as the reward base.',
    bullets: [
      'Enter the bill before tax and service charge.',
      'Enter the receipt or bill number.',
      'Leave gift card blank for a normal transaction.',
    ],
    visual: 'normal-transaction.png',
  },
  {
    title: 'Review The Normal-Sale Math',
    subtitle: 'Rewards are based on the base bill, while tax and service can still affect customer total.',
    bullets: [
      'Reward rate applies to the bill before tax/service.',
      'Tax and service charge do not create reward points.',
      'Use Process Without Gift Card only when no gift card is entered.',
    ],
    visual: 'normal-transaction.png',
  },
  {
    title: 'Gift Card Is Optional',
    subtitle: 'Only add a gift card when the customer is paying with one.',
    bullets: [
      'Scan, upload, paste, or type the gift card QR/link/code.',
      'Click Validate Gift Card.',
      'Confirm the card is Active and belongs to this business.',
    ],
    visual: 'gift-card-transaction.png',
  },
  {
    title: 'Valid Gift Cards Change The Available Button',
    subtitle: 'The page protects staff from processing the wrong transaction type.',
    bullets: [
      'Empty gift-card field shows Process Without Gift Card.',
      'Gift-card field with a valid card shows Process With Gift Card.',
      'Invalid or unvalidated gift cards cannot be processed.',
    ],
    visual: 'gift-card-transaction.png',
  },
  {
    title: 'Gift Cards Reduce The Customer Total',
    subtitle: 'The customer pays the remaining balance after discount, tax, and service rules.',
    bullets: [
      'Gift card discount reduces the amount due.',
      'Tax included means tax is added to the customer total.',
      'Rewards still use the base bill before tax and service.',
    ],
    visual: 'gift-card-transaction.png',
  },
  {
    title: 'Finish And Continue',
    subtitle: 'After a successful transaction, staff can immediately start the next one.',
    bullets: [
      'Click Process Without Gift Card for normal purchases.',
      'Click Process With Gift Card for validated gift-card purchases.',
      'Click New Transaction after success for the next customer.',
    ],
    visual: 'normal-transaction.png',
  },
  {
    title: 'History Shows Every Transaction',
    subtitle: 'Normal sales and gift-card sales appear together for review.',
    bullets: [
      'Receipt, date, and customer.',
      'Total, gift-card discount, and final price.',
      'Points awarded and gift-card code when used.',
    ],
    visual: 'transaction-history.png',
  },
  {
    title: 'The Rule Staff Should Remember',
    subtitle: 'Transactions is the only page staff need for purchase processing.',
    bullets: [
      'Scan or paste the customer Member QR.',
      'Add a gift card only when the customer pays with one.',
      'Review the preview before processing.',
      'Check Transaction History when auditing or helping a customer.',
    ],
    visual: 'transaction-history.png',
  },
]

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function textShape(id, name, x, y, cx, cy, text, size, color = '2c1a12', bold = false) {
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
      <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="${size}"${bold ? ' b="1"' : ''}><a:solidFill><a:srgbClr val="${color}"/></a:solidFill></a:rPr><a:t>${esc(text)}</a:t></a:r><a:endParaRPr lang="en-US" sz="${size}"/></a:p></p:txBody>
    </p:sp>`
}

function bulletShape(id, x, y, cx, cy, bullets) {
  const paragraphs = bullets.map((bullet) => `
    <a:p>
      <a:pPr marL="280000" indent="-140000"><a:buChar char="-"/></a:pPr>
      <a:r><a:rPr lang="en-US" sz="1950"><a:solidFill><a:srgbClr val="2c1a12"/></a:solidFill></a:rPr><a:t>${esc(bullet)}</a:t></a:r>
    </a:p>`).join('')

  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Main points"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>
      <p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paragraphs}</p:txBody>
    </p:sp>`
}

function roundedBox(id, x, y, cx, cy, fill, line = 'c89a62') {
  return `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}" name="Decorative box"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
      <p:spPr>
        <a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
        <a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom>
        <a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>
        <a:ln w="19050"><a:solidFill><a:srgbClr val="${line}"/></a:solidFill></a:ln>
      </p:spPr>
    </p:sp>`
}

function imageShape(id, name, relId, x, y, cx, cy) {
  return `
    <p:pic>
      <p:nvPicPr><p:cNvPr id="${id}" name="${esc(name)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
      <p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
      <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="roundRect"><a:avLst/></a:prstGeom><a:ln w="12700"><a:solidFill><a:srgbClr val="c89a62"/></a:solidFill></a:ln></p:spPr>
    </p:pic>`
}

function slideXml(slide, index) {
  const slideNo = index + 1
  const hasImage = Boolean(slide.visual)
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="fff6eb"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${roundedBox(2, 0, 0, 12192000, 609600, '5a351d', '5a351d')}
      ${textShape(3, 'Deck label', 457200, 170000, 5486400, 280000, 'Guatemala Rewards Staff Guide', 1500, 'fff6eb', true)}
      ${textShape(4, 'Slide number', 10750000, 170000, 914400, 280000, `${slideNo}/12`, 1350, 'fff6eb', true)}
      ${textShape(5, 'Title', 609600, 838200, 5029200, 1066800, slide.title, 3200, '6b3b18', true)}
      ${textShape(6, 'Subtitle', 609600, 1737360, 5029200, 609600, slide.subtitle, 1550, '7f654f')}
      ${bulletShape(7, 731520, 2590800, 4541520, 2743200, slide.bullets)}
      ${roundedBox(8, 5930000, 914400, 5486400, 4216400, 'fffaf2')}
      ${hasImage ? imageShape(9, slide.visual, 'rId2', 6130000, 1112520, 5086400, 3225800) : ''}
      ${textShape(10, 'Visual note', 6130000, 4510000, 5086400, 548640, 'Training visual uses sample data for staff practice.', 1300, '7f654f')}
      ${roundedBox(11, 609600, 5943600, 10972800, 304800, 'c89a62', 'c89a62')}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`
}

function slideRelsXml(imageIndex) {
  const imageRel = imageIndex
    ? `\n  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${imageIndex}.png"/>`
    : ''
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>${imageRel}
</Relationships>`
}

rmSync(outDir, { force: true, recursive: true })
for (const dir of [
  '_rels',
  'docProps',
  'ppt/_rels',
  'ppt/slides/_rels',
  'ppt/slides',
  'ppt/media',
  'ppt/slideLayouts/_rels',
  'ppt/slideLayouts',
  'ppt/slideMasters/_rels',
  'ppt/slideMasters',
  'ppt/theme',
]) {
  mkdirSync(join(outDir, dir), { recursive: true })
}

const imageMap = new Map()
for (const slide of slides) {
  if (!slide.visual || imageMap.has(slide.visual)) continue
  const next = imageMap.size + 1
  imageMap.set(slide.visual, next)
  copyFileSync(join(assetDir, slide.visual), join(outDir, 'ppt/media', `image${next}.png`))
}

writeFileSync(join(outDir, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slides.map((_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('\n  ')}
</Types>`)

writeFileSync(join(outDir, '_rels/.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`)

writeFileSync(join(outDir, 'docProps/core.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Business Transactions and Gift Cards Training</dc:title>
  <dc:creator>Guatemala Rewards</dc:creator>
  <cp:lastModifiedBy>Guatemala Rewards</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-07-02T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-07-02T00:00:00Z</dcterms:modified>
</cp:coreProperties>`)

writeFileSync(join(outDir, 'docProps/app.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Guatemala Rewards</Application><PresentationFormat>Widescreen</PresentationFormat><Slides>${slides.length}</Slides>
</Properties>`)

writeFileSync(join(outDir, 'ppt/presentation.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>
    ${slides.map((_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join('\n    ')}
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`)

writeFileSync(join(outDir, 'ppt/_rels/presentation.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slides.map((_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join('\n  ')}
</Relationships>`)

writeFileSync(join(outDir, 'ppt/slideMasters/slideMaster1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
</p:sldMaster>`)

writeFileSync(join(outDir, 'ppt/slideMasters/_rels/slideMaster1.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`)

writeFileSync(join(outDir, 'ppt/slideLayouts/slideLayout1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`)

writeFileSync(join(outDir, 'ppt/slideLayouts/_rels/slideLayout1.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`)

writeFileSync(join(outDir, 'ppt/theme/theme1.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Guatemala Rewards">
  <a:themeElements><a:clrScheme name="Guatemala Rewards"><a:dk1><a:srgbClr val="2c1a12"/></a:dk1><a:lt1><a:srgbClr val="fff6eb"/></a:lt1><a:dk2><a:srgbClr val="5a351d"/></a:dk2><a:lt2><a:srgbClr val="f4dfc8"/></a:lt2><a:accent1><a:srgbClr val="a96719"/></a:accent1><a:accent2><a:srgbClr val="c89a62"/></a:accent2><a:accent3><a:srgbClr val="2f6f4e"/></a:accent3><a:accent4><a:srgbClr val="f2c66d"/></a:accent4><a:accent5><a:srgbClr val="7f654f"/></a:accent5><a:accent6><a:srgbClr val="efe1d1"/></a:accent6><a:hlink><a:srgbClr val="a96719"/></a:hlink><a:folHlink><a:srgbClr val="7f654f"/></a:folHlink></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Aptos Display"/></a:majorFont><a:minorFont><a:latin typeface="Aptos"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements>
</a:theme>`)

slides.forEach((slide, index) => {
  writeFileSync(join(outDir, `ppt/slides/slide${index + 1}.xml`), slideXml(slide, index))
  writeFileSync(join(outDir, `ppt/slides/_rels/slide${index + 1}.xml.rels`), slideRelsXml(imageMap.get(slide.visual)))
})

console.log(outDir)
