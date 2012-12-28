#!/usr/bin/env python
# ==========
from django.utils import simplejson as json

import comments
import issues
import twitter
import util

# ----------
def get(method, context):
  if util.check_referrer(context['request'], context['response']) == False:
    return
  
  context['result'] = {
    'code': 'failure'
  }

  if method == 'get-twitter-url':
    twitter.get_authorization_url(context)
  elif method == 'new-issue':
    issues.new_issue(context)
  elif method == 'issues':
    issues.get_issues(context)
  elif method == 'get-issue':
    issues.get_issue(context)
  elif method == 'create-comment':
    comments.new_comment(context)
  elif method == 'get-issue-comments':
    comments.get_issue_comments(context)
  elif method == 'update-issue':
    issues.update_issue(context)
      
  context['response'].headers['Content-Type'] = 'application/json'
  context['response'].out.write(json.dumps(context['result']))
