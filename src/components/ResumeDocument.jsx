import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from '@react-pdf/renderer';
import { resumeDownload as data } from '../content/resumeDownload';

const gold = '#8a7340';
const dark = '#1a1a1a';
const muted = '#555555';
const lightRule = '#dddddd';

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 52,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.45,
    color: dark,
  },
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1.5,
    borderBottomColor: gold,
  },
  name: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headline: {
    fontSize: 11,
    color: gold,
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    fontSize: 8.5,
    color: muted,
  },
  contactLink: {
    color: muted,
    textDecoration: 'none',
  },
  section: {
    marginTop: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: gold,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: lightRule,
  },
  summary: {
    fontSize: 9.5,
    color: '#333333',
    textAlign: 'justify',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    fontSize: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderWidth: 0.5,
    borderColor: lightRule,
    color: '#444444',
  },
  jobBlock: {
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },
  jobPeriod: {
    fontSize: 8.5,
    color: muted,
    textAlign: 'right',
    minWidth: 90,
  },
  jobCompany: {
    fontSize: 9,
    color: '#444444',
    marginBottom: 5,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingRight: 8,
  },
  bulletDot: {
    width: 10,
    fontSize: 9,
    color: gold,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: '#333333',
  },
  productName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  productTag: {
    fontSize: 8.5,
    fontStyle: 'italic',
    color: muted,
    marginBottom: 4,
  },
  skillGroup: {
    marginBottom: 6,
  },
  skillLabel: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#444444',
    marginBottom: 3,
  },
  skillItems: {
    fontSize: 8.5,
    color: '#555555',
  },
  highlightItem: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#999999',
    borderTopWidth: 0.5,
    borderTopColor: lightRule,
    paddingTop: 8,
  },
});

function Bullets({ items }) {
  return items.map((item) => (
    <View key={item} style={styles.bulletRow} wrap={false}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{item}</Text>
    </View>
  ));
}

function SectionTitle({ children }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

export default function ResumeDocument() {
  const { contact } = data;

  return (
    <Document
      title={`${contact.name} — Resume`}
      author={contact.name}
      subject="Professional Resume"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{contact.name}</Text>
          <Text style={styles.headline}>{contact.headline}</Text>
          <View style={styles.contactRow}>
            <Text>{contact.city}</Text>
            <Text>·</Text>
            <Link src={`mailto:${contact.email}`} style={styles.contactLink}>
              {contact.email}
            </Link>
            <Text>·</Text>
            <Text>{contact.phone}</Text>
            <Text>·</Text>
            <Link src={contact.linkedin} style={styles.contactLink}>
              {contact.linkedinHandle}
            </Link>
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Professional Summary</SectionTitle>
          <Text style={styles.summary}>{data.summary}</Text>
        </View>

        <View style={styles.section}>
          <SectionTitle>Core Competencies</SectionTitle>
          <View style={styles.chipWrap}>
            {data.competencies.map((item) => (
              <Text key={item} style={styles.chip}>{item}</Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionTitle>Professional Experience</SectionTitle>
          {data.experience.map((job) => (
            <View key={`${job.company}-${job.period}`} style={styles.jobBlock}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobPeriod}>{job.period}</Text>
              </View>
              <Text style={styles.jobCompany}>
                {job.company} · {job.location}
              </Text>
              <Bullets items={job.bullets} />
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>{contact.name} — Resume</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <SectionTitle>Flagship Products & Ventures</SectionTitle>
          {data.products.map((product) => (
            <View key={product.name} style={styles.jobBlock}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.jobCompany}>{product.period}</Text>
              <Text style={styles.productTag}>{product.tagline}</Text>
              <Bullets items={product.bullets} />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionTitle>Selected Impact</SectionTitle>
          <Bullets items={data.highlights} />
        </View>

        <View style={styles.section}>
          <SectionTitle>Skills</SectionTitle>
          {Object.entries(data.skills).map(([group, items]) => (
            <View key={group} style={styles.skillGroup}>
              <Text style={styles.skillLabel}>{group}</Text>
              <Text style={styles.skillItems}>{items.join(' · ')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionTitle>Education</SectionTitle>
          {data.education.map((edu) => (
            <View key={edu.degree} style={styles.jobBlock}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{edu.degree}</Text>
                <Text style={styles.jobPeriod}>{edu.period}</Text>
              </View>
              <Text style={styles.jobCompany}>{edu.school}</Text>
              <Text style={styles.summary}>{edu.note}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SectionTitle>Certifications</SectionTitle>
          <Bullets items={data.certifications} />
        </View>

        <View style={styles.footer} fixed>
          <Text>{contact.name} — Resume</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
