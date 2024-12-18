const circleRadius = 250;
const svgWidth = 600;
const svgHeight = 600;

const colorScales = {
    'weight_lb': d3.scaleSequential(d3.interpolateOranges),
    'economy_mpg': d3.scaleSequential(d3.interpolateBlues),
    'power_hp': d3.scaleSequential(d3.interpolateGreens),
    'speed_sec': d3.scaleSequential(d3.interpolateReds)
};

d3.csv("cars.csv").then(carsData => {

    carsData.forEach(d => {
        d.economy_mpg = +d.economy_mpg;
        d.cylinders = +d.cylinders;
        d.displacement_cc = +d.displacement_cc;
        d.power_hp = +d.power_hp;
        d.weight_lb = +d.weight_lb;
        d.speed_sec = +d.speed_sec;
        d.year = +d.year;
    });

    const allDimensions = ['economy_mpg', 'cylinders', 'displacement_cc', 'power_hp', 'weight_lb', 'speed_sec', 'year'];

    const predictors = ['weight_lb', 'economy_mpg', 'power_hp', 'speed_sec'];

    predictors.forEach(predictor => {
        const dimensions = allDimensions.filter(dim => dim !== predictor);

        // Normalize the data
        dimensions.forEach(dimension => {
            const maxVal = d3.max(carsData, d => d[dimension]);
            const minVal = d3.min(carsData, d => d[dimension]);
            carsData.forEach(d => {
                d[dimension] = (d[dimension] - minVal) / (maxVal - minVal);
            });
        });

        const angleSlice = Math.PI * 2 / dimensions.length;
        const anchors = dimensions.map((d, i) => ({
            angle: i * angleSlice - Math.PI / 2,
            value: circleRadius * 0.55, // Reduce the radius for data points to be within the circle
        }));

        carsData.forEach(d => {
            let vectorX = 0;
            let vectorY = 0;

            dimensions.forEach((dimension, i) => {
                const normalizedValue = d[dimension];
                const anchor = anchors[i];
                // Calculate the vector components
                vectorX += anchor.value * normalizedValue * Math.cos(anchor.angle);
                vectorY += anchor.value * normalizedValue * Math.sin(anchor.angle);
            });

            // Calculate the final position (x, y) based on vector components
            d.x = vectorX + svgWidth / 2;
            d.y = vectorY + svgHeight / 2;
        });

        const colorScale = colorScales[predictor].domain(d3.extent(carsData, d => d[predictor]));

        const svg = d3.select('body').append('svg').attr('width', svgWidth).attr('height', svgHeight);
        svg.append('circle').attr('cx', svgWidth/2).attr('cy', svgHeight/2).attr('r', circleRadius).style('stroke', 'grey').style('fill', 'none');

        svg.selectAll('circle.datapoint').data(carsData).enter().append('circle').classed('datapoint', true)
            .attr('cx', d => d.x).attr('cy', d => d.y).attr('r', 5).style('fill', d => colorScale(d[predictor]));

        svg.selectAll('circle.anchor').data(anchors).enter().append('circle').classed('anchor', true)
            .attr('cx', d => d.value * 1.83 * Math.cos(d.angle) + svgWidth / 2).attr('cy', d => d.value * 1.83 * Math.sin(d.angle) + svgHeight / 2)
            .attr('r', 5).style('fill', 'blue');

        svg.selectAll('text').data(anchors).enter().append('text')
            .attr('x', d => d.value * 1.9 * Math.cos(d.angle) + svgWidth / 2).attr('y', d => d.value * 1.9 * Math.sin(d.angle) + svgHeight / 2)
            .text((d, i) => dimensions[i]).style('text-anchor', 'middle');

        svg.append('text')
            .attr('x', svgWidth / 2)
            .attr('y', 20)
            .text(`Predictor: ${predictor}`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold');
    });
});
