export function toCamel(o: any) {
  let newO: any, origKey: any, newKey: any, value: any
  if (o instanceof Array) {
    return o.map(function(value) {
      if (typeof value === "object") {
        value = toCamel(value)
      }
      if(value === "aRN"){
        value = "arn"
      }
      if(value === "iPSetReferenceStatement"){
        value = "ipSetReferenceStatement"
      }
      return value
    })
  } else {
    newO = {}
    for (origKey in o) {
      if (Object.prototype.hasOwnProperty.call(o, origKey)) {
        newKey = (origKey.charAt(0).toLowerCase() + origKey.slice(1) || origKey).toString()
        if(newKey === "aRN"){
          newKey = "arn"
        }
        if(newKey === "iPSetReferenceStatement"){
          newKey = "ipSetReferenceStatement"
        }
        value = o[origKey]
        if (value instanceof Array || (value !== null && value.constructor === Object)) {
          value = toCamel(value)
          if(value === "aRN"){
            value = "arn"
          }
        }
        newO[newKey] = value
      }
    }
  }
  return newO
}