#!/bin/bash
# validate-contract.sh — 合同 JSON Schema 校验 Hook
# 用法: bash validate-contract.sh [contract_file]
#   不传参: 自动校验 contracts/ 下最新的 .json 合同
#   传参:   校验指定合同文件
# 依赖: node + ajv (已安装在 .opencode/node_modules/)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$SCRIPT_DIR/../contracts"
SCHEMA_FILE="$CONTRACTS_DIR/contract-schema.json"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "错误: Schema 文件不存在: $SCHEMA_FILE"
    exit 1
fi

# 确定目标合同
if [ -n "${1:-}" ]; then
    CONTRACT_FILE="$1"
else
    CONTRACT_FILE=$(ls -t "$CONTRACTS_DIR"/*.json 2>/dev/null | grep -v 'contract-schema.json' | head -1)
    if [ -z "$CONTRACT_FILE" ]; then
        echo "错误: contracts/ 下无合同文件"
        exit 1
    fi
fi

if [ ! -f "$CONTRACT_FILE" ]; then
    echo "错误: 合同文件不存在: $CONTRACT_FILE"
    exit 1
fi

CONTRACT_NAME=$(basename "$CONTRACT_FILE")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "=========================================="
echo "  Contract Validation  $TIMESTAMP"
echo "  Schema  : $(basename "$SCHEMA_FILE")"
echo "  Contract: $CONTRACT_NAME"
echo "=========================================="

# 使用 node + ajv 进行 JSON Schema 校验
node -e "
var Ajv = require('ajv');
var fs   = require('fs');
var path = require('path');

var schema   = JSON.parse(fs.readFileSync('$SCHEMA_FILE', 'utf8'));
var contract = JSON.parse(fs.readFileSync('$CONTRACT_FILE', 'utf8'));

var ajv = new Ajv({ allErrors: true });
var validate = ajv.compile(schema);
var valid = validate(contract);

var errors = [];
if (!valid) {
    validate.errors.forEach(function(e) {
        errors.push((e.instancePath || '/') + ': ' + e.message);
    });
}

// 自定义校验: 时效性 (30 分钟)
if (typeof contract.timestamp === 'number') {
    var age = Math.floor(Date.now() / 1000) - contract.timestamp;
    if (age > 1800) {
        errors.push('/timestamp: 合同已过期 (' + Math.floor(age/60) + ' 分钟前，超过 30 分钟上限)');
    }
}

// 自定义校验: 文件存在性
var contractDir = path.dirname('$CONTRACT_FILE');
var projectRoot = path.resolve(contractDir, '..', '..');
if (Array.isArray(contract.files_to_modify)) {
    contract.files_to_modify.forEach(function(f) {
        if (!fs.existsSync(path.join(projectRoot, f))) {
            errors.push('/files_to_modify/' + f + ': 文件不存在: ' + f);
        }
    });
}

if (errors.length === 0) {
    console.log('');
    console.log('PASS');
    process.exit(0);
} else {
    console.log('');
    console.log('FAIL (' + errors.length + ' errors)');
    errors.forEach(function(e, i) {
        console.log('  ' + (i+1) + '. ' + e);
    });
    process.exit(1);
}
" 2>&1

EXIT_CODE=$?
echo "=========================================="
exit $EXIT_CODE
