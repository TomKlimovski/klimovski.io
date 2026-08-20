import styled from '@emotion/styled';

import { regularLightTextStyle } from '../../styles/_typographies';

const Row = styled.div`
    display: flex;
    flex-direction: row;
    gap: 30px;
    padding-left: 10px;
    align-items: flex-start;
    flex-wrap: wrap;
`;

const Art = styled.pre`
    color: ${(props) => props.theme.colors.fireOpal};
    margin: 0;
    line-height: 1.15;
    ${regularLightTextStyle};
`;

const Info = styled.div`
    color: ${(props) => props.theme.colors.white};
    ${regularLightTextStyle};
`;

const Label = styled.span`
    color: ${(props) => props.theme.colors.ruby};
`;

export default function NeofetchOutput({ art, info, title }) {
    return (
        <Row>
            <Art>{art.join('\n')}</Art>
            <Info>
                <div><Label>{title}</Label></div>
                <div>{'-'.repeat(title.length)}</div>
                {info.map(([label, value]) => (
                    <div key={label}><Label>{label}:</Label> {value}</div>
                ))}
            </Info>
        </Row>
    );
}
