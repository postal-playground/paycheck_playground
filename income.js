const seniority_steps = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P']
const ptf_rates = [25.92, 27.03, 28.14, 29.25, 30.36, 31.47, 32.58, 33.69, 34.8, 35.9, 37.01, 38.12, 39.23, 40.34, 41.09]
const regular_rates = [24.82, 25.89, 26.95, 28.01, 29.07, 30.14, 31.2, 32.26, 33.32, 34.39, 35.45, 36.51, 37.57, 38.63, 39.35]
const technician_rates = [25.34, 26.43, 27.51, 28.6, 29.68, 30.77, 31.85, 32.94, 34.02, 35.11, 36.19, 37.28, 38.36, 39.45, 40.18]


class EmployeeRate {
    // contains pay rates (OT and strait) per job title/pay step
    constructor(title, step) {
        this.title = title;
        this.step = step;
        const index = seniority_steps.indexOf(step);
        switch (title) {
            case 'PTF':
                this.ot = regular_rates[index];
                this.strait = ptf_rates[index];
                break;
            case 'Regular':
                this.strait = regular_rates[index];
                this.ot = this.strait;
                break;
            case 'T6':
                this.strait = technician_rates[index];
                this.ot = this.strait;
                break;
        }
    }
    payrates() {
        return {st:this.strait, ot:this.ot, pt:this.ot, nt:this.ot, sun:this.ot, cf:0};
    }
}

function make_employee() {
    const title = document.getElementById('inputRole').value;
    const tier = document.getElementById('inputTier').value;
    return new EmployeeRate(title, tier);
}

function sum(array_of_numbers) {
    return array_of_numbers.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

const multipliers = {st:1, ot:1.5, pt:2, nt:0.05, sun:0.25, cf:0}; //integers for precision
const hours_labels = {total:"Work Hours", ot:"Overtime", nt:"Night Work", sun:"Sunday Premium", pt:"Penalty Overtime"};
const output_labels = {st:"Work Hours", ot:"Overtime Hours", nt:"Night Work Prem Hours", sun:"Sunday Premium", pt:"Penalty Overtime Payment", cf:"Crossfoot", gross:"Total Hours Gross Pay"};
const display_order = ["pt", "st", "ot", "nt", "sun", "cf", "gross"];

const calc_gross_button = document.querySelector('[gross]');
const calc_net_button = document.querySelector('[net]');
const new_row_button = document.getElementById('add-row-button')
window.gross_income = 0;
window.total_strait_pay = 0;
const hours_input_table = new Input_table_factory("hours-inputs", hours_labels, [new Number_input("week1", 0, 0, 0.01), new Number_input("week2", 0, 0, 0.01)]);
if (calc_gross_button) {
    calc_gross_button.addEventListener('click', event =>{
        event.preventDefault(); // Prevent default form submission

        const payrates = make_employee().payrates();
        
        const hours_input = hours_input_table.parse_inputs(true);
        const pay_subtotals = calculate_pay(hours_input, payrates, multipliers);
        total_strait_pay = pay_subtotals.st[0] + pay_subtotals.st[1];
        gross_income = calculate_gross_pay(pay_subtotals);
        const output_display = display_time_pay(hours_input, pay_subtotals, output_labels, gross_income);
        const time_pay_display_table = new Build_fully_defined_table("time-pay-display", output_display, display_order);
        time_pay_display_table.build_table();
        document.getElementById('grossTable').classList.remove("hidden");
    })
}

function to_decimal_places(arr, places) {
    return arr.map(number => {
        return Number(number).toFixed(places);
    })
}

export function to_dollars(input) {
    //return array of dollar formatted strings instead of floats
    if (Array.isArray(input)) {
        return input.map(number => {
            return number.toLocaleString('en-US',{
                style: 'currency',
                currency: 'USD', 
            });
        });
    } else {
        return input.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });
    }
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
    for (const clock_function in obj) {
        obj[clock_function] = to_decimal_places(obj[clock_function], 2)
    };
    delete obj.total;
}

function calculate_pay(times, rates, multipliers) {
    let pay = {};
    fix_times(times);
    for (const task in times) {
        for (let i = 0; i < times[task].length; i++){
            let multiplicands = [times[task][i], rates[task], multipliers[task]];
            let product = safe_penny_multiplication(multiplicands);
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
    let product = array.reduce((accumulator, x) => parseInt(100*x)*accumulator, 1);
    return product/(100**array.length);
}

function calculate_gross_pay(pay) {
    let gross = 0;
    for (const task in pay) {
        gross = gross + pay[task].reduce((accumulator, x) => (accumulator + x), 0);
    }
    return gross;
}
