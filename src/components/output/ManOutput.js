import styled from '@emotion/styled';

import { regularLightTextStyle, regularTextStyle } from '../../styles/_typographies';

const Page = styled.div`
    color: ${(props) => props.theme.colors.white};
    width: 100%;
    box-sizing: border-box;
    padding: 0 10px;
    display: flex;
    flex-direction: column;
    white-space: pre-wrap;
    ${regularLightTextStyle};
`;

const Header = styled.div`
    display: flex;
    justify-content: space-between;
    color: ${(props) => props.theme.colors.opal};
    ${regularTextStyle};
`;

const Heading = styled.div`
    margin-top: 12px;
    color: ${(props) => props.theme.colors.ruby};
    ${regularTextStyle};
`;

const Body = styled.div`
    padding-left: 24px;
`;

export default function ManOutput({ page }) {
    return (
        <Page>
            <Header>
                <span>{page.title}</span>
                <span>{page.center}</span>
                <span>{page.title}</span>
            </Header>
            {page.sections.map((s) => (
                <div key={s.heading}>
                    <Heading>{s.heading}</Heading>
                    <Body>
                        {s.lines.map((line, i) => <div key={i}>{line || ' '}</div>)}
                    </Body>
                </div>
            ))}
        </Page>
    );
}
