function to_decimal_places(array, places) {
    return array.map(number => {
        return number.toFixed(places);
    })
}

function to_dollars(array) {
    //return array of dollar formatted strings instead of floats
    return array.map(number => {
        return number.toLocaleString('en-US',{
            style: 'currency',
            currency: 'USD', 
        });
    });
}

function fix_times(obj) {
    //modifies object, not need to return anything
    obj.cf = [];
    obj.st = [];
    for (let i=0; i < obj.total.length; i++){
        //leaving this so it allows > 40 hrs strait or negative cf
        //this will help users idenfiy entry errors.
        obj.st[i] = obj.total[i] - obj.ot[i] - obj.pt[i];
        obj.cf[i] = 40 - obj.st[i];
    }
    delete obj.total;
}

function calculate_pay(times, rates, multipliers) {
    let pay = {};
    fix_times(times);
    for (const task in times) {
        for (let i = 0; i < times[task].length; i++){
            let multiplicands = [times[task][i], rates[task], multipliers[task]];
            product = safe_penny_multiplication(multiplicands);
            //again, magic to push to array or create array if not exists yet
            (pay[task] = pay[task] || []).push(product);
        }
    }
    return pay;
}

function display_time_pay(times, pay_object, labels, total) {
    let display_obj = {};
    for (const task in times) {
        let texts = times[task].concat(to_dollars(pay_object[task]));
        texts.unshift(labels[task]);
        let text_cells = [];
        for (const text of texts) {
            text_cells.push(new Text_cell(text, "output-display-text"));
        }
        display_obj[task] = text_cells;
    }
    //Add summary row
    display_obj["gross"] = Array(3).fill(new Text_cell("", "output-display-text"));
    display_obj["gross"].push(new Text_cell("Gross Income", "gross-pay"));
    display_obj["gross"].push(new Text_cell(to_dollars([total])[0], "gross-pay")); 
    return display_obj;
}

function safe_penny_multiplication(array) {
    //can be generalized by splitting strings by decimals to get powers of 10
    product = array.reduce((accumulator, x) => parseInt(100*x)*accumulator, 1);
    return product/(100**array.length);
}

function calculate_gross_pay(pay) {
    let gross = 0;
    for (const task in pay) {
        gross = gross + pay[task].reduce((accumulator, x) => (accumulator + x), 0);
    }
    return gross;
}
