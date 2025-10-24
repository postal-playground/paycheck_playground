import { to_dollars } from "./income.js";

class Deduction {
    constructor(key, title, value, is_pretax = true, is_percent = false, base_of_percent = 0) {
        if (typeof is_percent !== "boolean" || typeof is_pretax !== "boolean") {
            throw new TypeError("is_percent and is_pretax must be either true or false.");
        }
        this.key = key;
        this.title = title;
        this.value = value.toFixed(2);
        this.is_percent = is_percent;
        this.is_pretax = is_pretax;
        this.base = base_of_percent.toFixed(2);
    }

    #title_text() {
        return new Text_cell(this.title, "left-column-text");
    }

    #value_box() {
        return new Number_input(this.key + "_value", this.value, 0, 0.01);
    }

    #percent_box() {
        let box = new Check_box(this.key + "_percent", this.is_percent);
        box.config.disabled = true;
        return box
    }

    #pretax_box() {
        let box = new Check_box(this.key + "_pretax", this.is_pretax);
        box.config.disabled = true;
        return box
    }

    #dollar_display() {
        return new Text_cell(to_dollars(this.dollar_amount()))
         
    }

    defined() {
        return [this.#title_text(), 
            this.#value_box(), 
            this.#pretax_box(), 
            this.#percent_box(),
            this.#dollar_display()
        ]
    }

    static undefined() {
        return [new Text_input("new_deduction", 'New Deduction'),
            new Number_input("new_deduction_value", 0, 0, 0.01),
            new Check_box("new_deduction_pretax", checked = false),
            new Check_box("new_deduction_percent", checked = false)
        ]
    }

    dollar_amount() {
        if (this.is_percent == true) {
            let number = this.value * this.base/100;
            return Math.round(number*100)/100;
        } else {
            let number = this.value;
            return Math.round(number*100)/100;
        }
    }
    
}

function typical_deductions() {
    //keep as function, becasue window.total_strait_pay will change by user
    return {
        fers: ["Retirement FERS", 4.4, false, true, window.total_strait_pay],
        hsa: ["Health Savings Account", 0, true, false],
        fsa: ["Flex Savings Account", 0, true, false],
        dcfsa: ["Dependent Care FSA", 0, true, false],
        tsp_roth: ["TSP Roth", 5, false, true, window.total_strait_pay],
        tsp_trad: ["TSP Regular", 5, true, true, window.total_strait_pay],
        health_ins: ["Health Plan (pretax)", 207.66, true, false],
        union_dues: ["Union Dues", 30.97, false, false],
    }
}

function taxes() {
    //keep as function, becasue taxable income & federal_withholdings will change by user
    return {
        soc_sec: ["Social Security", 6.2, false, true, taxable_income],
        medicare: ["Medicare", 1.45, false, true, taxable_income],
        fed_tax: ["Federal Income Tax", window.federal_withholdings, false, false],
        //state_tax: ["State Income Tax", 4, false, true, window.taxable_income],
    }
}

function make_deductions_selection_box(typical_deductions) {
    let selectable_deduction_options = {};
    for (let key in typical_deductions) {
        selectable_deduction_options[key] = typical_deductions[key][0];
    }
    let deductions_select_box = new Select_box("deductions_select", selectable_deduction_options, true);
    insert_element(deductions_select_box.element, 'deductions-form', true);
}

function get_multiple_select_results(id) {
    const selectElement = document.getElementById(id);
    const selectedOptions = Array.from(selectElement.selectedOptions)
    return selectedOptions.map(option => option.value);
}

function subset_by_substring(set = {}, substring, delete_substring = true) {
    const keys = Object.keys(set);
    const matching_keys = keys.filter(key => key.includes(substring));
    const subset = {};
    if (delete_substring) {
        matching_keys.forEach(key => {
            subset[key.replace(substring, "")] = set[key];
        });
    } else {
        matching_keys.forEach(key => {
            subset[key] = set[key];
        });
    }
    return subset
}

function update_deduction_values(raw_input_results, my_deduction_objects) {
    //filter to look only at "_value" inputsS 
    let values = subset_by_substring(raw_input_results, "_value", true);
    //values are in an array, may be strings instead of numbers
    for (let key in values) {
        my_deduction_objects[key].value = Number(values[key]);
    }
}

function subtotal_deductions(deduction_objects, pretax = true) {
    let subtotal = 0;
    for (let deduction in deduction_objects) {
        if (deduction_objects[deduction].is_pretax == pretax && !taxes().hasOwnProperty(deduction)) {
            subtotal = subtotal + deduction_objects[deduction].dollar_amount();
        }
    }
    return Math.round(subtotal*100)/100;
}

function subtotal_taxes(deduction_objects) {
    let subtotal = 0;
    for (let deduction in deduction_objects) {
        if (deduction in Object.keys(taxes())) {
            subtotal = subtotal + deduction_objects[deduction].dollar_amount();
        }
    }
    return  Math.round(subtotal*100)/100;
}

let deduction_objects = {};
function populate_deduction_objects(deductions, deduction_properties) {
    for (let deduction of deductions) {
        let array_of_cells = deduction_properties[deduction];
        array_of_cells.unshift(deduction);
        let new_object = new Deduction(...array_of_cells);
        deduction_objects[deduction] = new_object;
    }
}

function make_deductions_input_table(my_deduction_objects) {
    let deduction_table_elements = {};
    for (let deduction in my_deduction_objects) {
        deduction_table_elements[deduction] = my_deduction_objects[deduction].defined();
    }
    const deductions_table = new Build_fully_defined_table("deductions-input-table", deduction_table_elements, Object.keys(my_deduction_objects));
    return deductions_table;
}

const submit_deductions_selection_button =  document.getElementById('submit-deductions-select-button');
const calculate_net_to_bank_button = document.getElementById('calculate-net-to-bank-button');
make_deductions_selection_box(typical_deductions())

let input_table = {};
if (submit_deductions_selection_button) {
    submit_deductions_selection_button.addEventListener('click', event =>{
        event.preventDefault();
        let selected_deductions = get_multiple_select_results("deductions_select");
        populate_deduction_objects(selected_deductions, typical_deductions());
        input_table = make_deductions_input_table(deduction_objects);
        input_table.build_table();
    })
}

window.taxable_income = 0;
let net_to_bank = 0;
if (calculate_net_to_bank_button) {
    calculate_net_to_bank_button.addEventListener('click', event => {
        event.preventDefault();

        let deduction_inputs = input_table.parse_inputs();
        update_deduction_values(deduction_inputs, deduction_objects)
        let pretax_deductions = subtotal_deductions(deduction_objects, true);
        let post_tax_deductions = subtotal_deductions(deduction_objects, false);
        taxable_income = Math.round((window.gross_income - pretax_deductions)*100)/100;
            
        const submit_w4_button =  document.getElementById('submit-w4-button');
        submit_w4_button.click(); //to update tax worksheet with taxable_income

        populate_deduction_objects(Object.keys(taxes()), taxes());
        let final_table = make_deductions_input_table(deduction_objects);
        final_table.build_table();
        let net_to_bank = taxable_income - post_tax_deductions - subtotal_taxes();
        let net_to_bank_row = [
            new Text_cell("Net to bank", "gross-pay"), 
            new Text_cell(net_to_bank, "gross-pay"),
            new Text_cell("State taxes and life insurance not yet accounted for", "text")
        ];
        final_table.add_row(net_to_bank_row);
        //find tax on gross income minus tax on taxable income = tax savings
        //tax savings per line item is relative to fraction of pretax_deductions
    })
}
